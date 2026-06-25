import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { supabase } from "./supabase";
import { estimateValuation } from "./demo/valuation.js";
import { aiValuation, isLiveEnabled } from "./demo/aiValuation.js";

/* ═══════════════════════════════════════════
   TOKENS
   ═══════════════════════════════════════════ */
const C = {
  bg: "#080808", panel: "#0f0f0f", panelBorder: "rgba(255,255,255,0.06)",
  surface: "#161616", gold: "#8a9a6e", goldBright: "#a0b27e",
  goldSubtle: "rgba(138,154,110,0.08)", goldDim: "rgba(138,154,110,0.35)",
  white: "#e8e8e4", text: "#b0b0a8", textMuted: "#6a6a64", textDark: "#3e3e3a",
  green: "#7a9e6a", greenBg: "rgba(122,158,106,0.1)", greenBorder: "rgba(122,158,106,0.3)",
  blue: "#6a8eaa", blueBg: "rgba(106,142,170,0.1)",
  orange: "#b08a5a", orangeBg: "rgba(176,138,90,0.1)",
  red: "#c45050",
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Outfit', sans-serif";
const serif = "'Cormorant Garamond', serif";

/* ─── helpers ─── */
const fmtVal = v => {
  if (!v) return null;
  if (v >= 1e6) return `€ ${(v / 1e6).toFixed(2).replace(".", ",")}M`;
  return `€ ${Number(v).toLocaleString("nl-BE")}`;
};
const formatRelTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (h < 1) return "Zojuist"; if (h < 24) return `${h}u geleden`;
  if (d < 7) return `${d}d geleden`;
  return new Date(ts).toLocaleDateString("nl-BE");
};
const nlMonth = (dateStr) => {
  if (!dateStr) return { day: "—", month: "" };
  const d = new Date(dateStr);
  const months = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
  return { day: String(d.getDate()), month: months[d.getMonth()] };
};

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    garaged:          { bg: C.goldSubtle,  border: C.goldDim,        color: C.gold,   label: "In garage" },
    "in-service":     { bg: C.blueBg,      border: C.blue+"40",      color: C.blue,   label: "In service" },
    "pickup-scheduled":{ bg: C.orangeBg,   border: C.orange+"40",    color: C.orange, label: "Ophaling gepland" },
    "in-progress":    { bg: C.blueBg,      border: C.blue+"40",      color: C.blue,   label: "In uitvoering" },
    scheduled:        { bg: C.goldSubtle,  border: C.goldDim,        color: C.gold,   label: "Gepland" },
    completed:        { bg: C.greenBg,     border: C.greenBorder,    color: C.green,  label: "Voltooid" },
    paid:             { bg: C.greenBg,     border: C.greenBorder,    color: C.green,  label: "Betaald" },
    pending:          { bg: C.goldSubtle,  border: C.goldDim,        color: C.gold,   label: "Open" },
    overdue:          { bg: "rgba(196,80,80,0.06)", border: C.red+"40", color: C.red, label: "Achterstallig" },
    draft:            { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", color: C.textMuted, label: "Concept" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ padding: "3px 10px", fontSize: 9, fontFamily: mono, fontWeight: 600, letterSpacing: "0.14em",
      borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label.toUpperCase()}
    </span>
  );
};

/* ═══════════════════════════════════════════
   3D SCENE
   ═══════════════════════════════════════════ */
function buildScene(canvas, modelUrl) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return { cleanup: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);

  // Image-based lighting: geeft de lak realistische studio-reflecties (cruciaal voor donkere wagens).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Camera — closer hero framing
  const cam = new THREE.PerspectiveCamera(30, w / h, 0.1, 200);
  cam.position.set(4.9, 1.8, 4.9);
  cam.lookAt(0, 0.6, 0);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.62, metalness: 0.2 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Contact shadow
  const sc = document.createElement("canvas"); sc.width = 512; sc.height = 512;
  const sctx = sc.getContext("2d");
  const sg = sctx.createRadialGradient(256,256,10,256,256,240);
  sg.addColorStop(0,"rgba(0,0,0,0.7)"); sg.addColorStop(0.4,"rgba(0,0,0,0.3)"); sg.addColorStop(1,"rgba(0,0,0,0)");
  sctx.fillStyle = sg; sctx.fillRect(0,0,512,512);
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(9,6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadowMesh.rotation.x = -Math.PI/2; shadowMesh.position.y = 0.005; scene.add(shadowMesh);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(5, 10, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
  const key = new THREE.SpotLight(0xffffff, 5, 35, Math.PI/4, 0.5);
  key.position.set(7, 7, 6); key.lookAt(0,0,0); scene.add(key);
  const fill = new THREE.SpotLight(0xeeeeff, 2.5, 35, Math.PI/3, 0.6);
  fill.position.set(-8, 5, 2); fill.lookAt(0,0,0); scene.add(fill);
  const rim = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI/5, 0.4);
  rim.position.set(-2, 4, -8); rim.lookAt(0,0.5,0); scene.add(rim);
  const topLight = new THREE.PointLight(0xffffff, 2, 30);
  topLight.position.set(0, 12, 0);
  scene.add(topLight);

  // Load model
  const carGroup = new THREE.Group(); scene.add(carGroup);
  if (modelUrl) {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(7.0 / Math.max(size.x, size.y, size.z)); // hero presence, past binnen het kader
      const sBox = new THREE.Box3().setFromObject(model);
      const c = sBox.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -sBox.min.y, -c.z);
      const isChiron = modelUrl && modelUrl.includes("v-chiron");
      model.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true;
        if (!isChiron) return;
        const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
        mats.forEach(m => {
          if (!m || !m.color) return;
          const n = m.name || "";
          // Chiron Super Sport "Bleu Royal Carbon": diep navy body, zilveren streep, donker carbon vleugel, zwarte uitlaten.
          if (n === "Bugatti Chiron Carbon Body") { m.map = null; m.color.set("#0e1a33"); m.metalness = 0.45; m.roughness = 0.22; }
          else if (n === "Bugatti Chiron Stripping Body") { m.map = null; m.color.set("#c6cace"); m.metalness = 0.85; m.roughness = 0.2; } // middenstreep -> zilver
          else if (n === "Bugatti Chiron Titanium Exhaust" || n === "Bugatti Chiron Exhaust") { m.map = null; m.color.set("#141414"); m.metalness = 0.55; m.roughness = 0.5; } // uitlaten -> zwart
          else if (n === "Bugatti Chiron Carbon Piston SPoiler" || n === "Bugatti Chiron Spoiler Base") { m.color.set("#16161a"); m.metalness = 0.3; m.roughness = 0.42; } // achtervleugel -> donker carbon
          else if (n === "Bugatti Chiron Chasis") { m.map = null; m.color.set("#26282c"); m.metalness = 0.65; m.roughness = 0.34; } // C-lijn + ruit-omlijsting/cowl -> antraciet carbon-metallic
          else if (n === "Bugatti Chiron Grill" || n === "Bugatti Chiron Radiator") { m.color.set("#0a0a0b"); m.metalness = 0.5; m.roughness = 0.55; } // grille-mesh -> donker
          else if (n === "Bugatti Chiron Shroud") { m.map = null; m.color.set("#0a0a0b"); m.metalness = 0.4; m.roughness = 0.5; } // ruit-omlijsting / ruitenwisser-cowl -> zwart
          else if (n === "Bugatti Chiron Grill Door") { m.map = null; m.color.set("#0a0a0b"); m.metalness = 0.5; m.roughness = 0.55; } // -> zwart
          // Interieur -> cognac leer
          else if (n === "Bugatti Chiron Interior Material" || n === "Bugatti Chiron Stripping Interior" || n === "Bugatti Chiron InteriorZone2" || n === "Bugatti Chiron InteriorZone2A") { m.map = null; m.color.set("#3a2210"); m.metalness = 0.05; m.roughness = 0.7; } // donker cognac / espresso
          // "Badge" laten we native (originele Bugatti-embleem textuur) -> niet overschrijven
          else if (n === "Bugatti Chiron Material") { m.color.set("#141416"); m.metalness = 0.3; m.roughness = 0.45; } // zij-luchtinlaat blades -> donker carbon
        });
      } });
      carGroup.add(model);
    });
  }

  // Controls
  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.minDistance = 5; controls.maxDistance = 18;
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0.62, 0);
  controls.autoRotate = true; controls.autoRotateSpeed = 0.35;

  let af;
  const animate = () => { af = requestAnimationFrame(animate); controls.update(); renderer.render(scene, cam); };
  animate();

  const onResize = () => {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    cam.aspect = nw/nh; cam.updateProjectionMatrix(); renderer.setSize(nw, nh);
  };
  window.addEventListener("resize", onResize);

  return { cleanup: () => { cancelAnimationFrame(af); controls.dispose(); renderer.dispose(); window.removeEventListener("resize", onResize); } };
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function ClientPortal({ user, clientId, onSignOut }) {
  const [client, setClient]       = useState(null);
  const [vehicles, setVehicles]   = useState([]);
  const [services, setServices]   = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [carIdx, setCarIdx]       = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nav, setNav]             = useState("dashboard");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const canvasRef  = useRef(null);
  const cleanupRef = useRef(null);

  // AI-waarderingen: map van vehicle.id → schatting object
  const [valuations, setValuations] = useState({});

  useEffect(() => { if (clientId) loadAll(); else setLoading(false); }, [clientId]);

  // Laad AI-waarderingen zodra voertuigen beschikbaar zijn.
  // Synchrone offline schatting is onmiddellijk; async live vervangt nadien.
  useEffect(() => {
    if (vehicles.length === 0) return;
    // Onmiddellijk: offline schattingen voor alle wagens
    const offline = {};
    vehicles.forEach(v => { offline[v.id] = estimateValuation(v); });
    setValuations(offline);
    // Async: live Claude indien ingeschakeld (per wagen onafhankelijk)
    if (isLiveEnabled()) {
      vehicles.forEach(v => {
        aiValuation(v).then(result => {
          setValuations(prev => ({ ...prev, [v.id]: result }));
        }).catch(() => {}); // fout al afgehandeld in aiValuation
      });
    }
  }, [vehicles]);

  const loadAll = async () => {
    setLoading(true);
    const [cR,vR,sR,iR,mR] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("vehicles").select("*, models(name, model_3d_path, year, brands(name))").eq("client_id", clientId).order("created_at"),
      supabase.from("services").select("*, vehicles(plate, models(name, brands(name)))").eq("client_id", clientId).order("date"),
      supabase.from("invoices").select("*").eq("client_id", clientId).order("date", { ascending: false }),
      supabase.from("messages").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);
    setClient(cR.data); setVehicles(vR.data ?? []); setServices(sR.data ?? []);
    setInvoices(iR.data ?? []); setMessages(mR.data ?? []);
    setLoading(false);
  };

  // 3D scene lifecycle
  const vehicle = vehicles[carIdx % Math.max(1, vehicles.length)] ?? null;
  const displayMode = vehicle?.display_mode || "3d";
  const modelPath = vehicle?.models?.model_3d_path ?? null;
  const modelUrl  = modelPath ? supabase.storage.from("3d-models").getPublicUrl(modelPath).data.publicUrl : null;
  const imageUrl  = vehicle?.image_path ? supabase.storage.from("3d-models").getPublicUrl(vehicle.image_path).data.publicUrl : null;

  useEffect(() => {
    if (loading || displayMode !== "3d" || !canvasRef.current || nav !== "dashboard") return;
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    const result = buildScene(canvasRef.current, modelUrl);
    cleanupRef.current = result.cleanup;
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [loading, displayMode, vehicle?.id, modelUrl, nav]);

  const firstName  = client?.name?.split(" ")[0] ?? "Welkom";
  const brandName  = vehicle?.models?.brands?.name ?? "";
  const modelName  = vehicle?.models?.name ?? "";
  const unread     = messages.filter(m => !m.read && m.direction === "outgoing").length;

  const activeService   = services.find(s => s.status === "in-progress" || s.status === "scheduled");
  const plannedServices = services.filter(s => s.status === "scheduled").slice(0, 3);

  const totalValue    = vehicles.reduce((sum, v) => sum + (v.current_value ?? v.value ?? 0), 0);
  const totalPurchase = vehicles.reduce((sum, v) => sum + (v.purchase_value ?? v.value ?? 0), 0);
  const valueDelta    = totalValue - totalPurchase;
  const valuePct      = totalPurchase ? ((valueDelta / totalPurchase) * 100) : 0;

  const sendMessage = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) return;
    await supabase.from("messages").insert({ client_id: clientId, subject: composeSubject.trim(), body: composeBody.trim(), direction: "incoming", read: false });
    setComposeOpen(false); setComposeSubject(""); setComposeBody("");
    loadAll();
  };

  /* ─── shared sub-styles ─── */
  const inputSt = { width:"100%", padding:"10px 14px", background:C.surface, border:`1px solid rgba(255,255,255,0.08)`, borderRadius:6, color:C.white, fontSize:12, fontFamily:sans, outline:"none" };

  /* ─── MODAL ─── */
  const Modal = ({ open, onClose, title, children, width=480 }) => {
    if (!open) return null;
    return (
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)" }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:16,padding:"28px",width:"100%",maxWidth:width,maxHeight:"85vh",overflowY:"auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
            <span style={{ fontSize:10,letterSpacing:"0.3em",color:C.textMuted,fontFamily:mono }}>{title}</span>
            <div onClick={onClose} style={{ cursor:"pointer",color:C.textMuted,fontSize:16,padding:4 }}>✕</div>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const Btn = ({ children, onClick, primary, small, style }) => (
    <button onClick={onClick} style={{ padding: small ? "7px 14px" : "10px 20px", fontSize: small ? 10 : 11, fontFamily: mono, fontWeight:500, letterSpacing:"0.12em",
      border: primary ? `1px solid ${C.gold}60` : `1px solid rgba(255,255,255,0.1)`,
      background: primary ? C.goldSubtle : "transparent",
      color: primary ? C.gold : C.textMuted, borderRadius:6, cursor:"pointer", transition:"all 0.2s", ...style }}
      onMouseEnter={e=>{ e.currentTarget.style.opacity="0.75"; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}
    >{children}</button>
  );

  /* ═══ SECTION VIEWS (non-dashboard) ═══ */
  if (nav !== "dashboard") {
    const sectionTitle = { wagens:"MIJN WAGENS", services:"SERVICES", facturen:"FACTUREN", berichten:"BERICHTEN", portfolio:"PORTFOLIO" }[nav];
    return (
      <div style={{ height:"100vh", background:C.bg, color:C.white, fontFamily:sans, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <style>{`::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}*{box-sizing:border-box} input::placeholder,textarea::placeholder{color:#3e3e3a}`}</style>

        {/* Section header */}
        <div style={{ height:56, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div onClick={()=>setNav("dashboard")} style={{ width:32,height:32,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.textMuted,fontSize:16 }}>‹</div>
            <span style={{ fontFamily:serif, fontSize:18, color:C.white }}>raù</span>
            <span style={{ fontSize:10, letterSpacing:"0.25em", color:C.textMuted }}>{sectionTitle}</span>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding: 24, paddingBottom: 80 }}>
          {/* ── WAGENS ── */}
          {nav === "wagens" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:14 }}>
              {vehicles.length === 0 && <p style={{ color:C.textMuted }}>Geen wagens gevonden</p>}
              {vehicles.map(v => {
                const vBrand = v.models?.brands?.name || "—"; const vModel = v.models?.name || "—";
                return (
                  <div key={v.id} style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:14, overflow:"hidden" }}>
                    <div style={{ height:3, background:`linear-gradient(90deg, ${C.gold}, ${C.goldDim})` }} />
                    <div style={{ padding:"20px 22px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:10, letterSpacing:"0.25em", color:C.textMuted }}>{vBrand.toUpperCase()}</div>
                          <div style={{ fontSize:22, fontFamily:serif, fontWeight:400, color:C.white, marginTop:2 }}>{vModel}</div>
                        </div>
                        <StatusBadge status={v.status} />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[["NUMMERPLAAT", v.plate],["KLEUR", v.color||"—"],["KILOMETERSTAND", v.mileage||"—"],["VOLGENDE SERVICE", v.next_service||"—"]].map(([l,val],i)=>(
                          <div key={i}><div style={{ fontSize:8, letterSpacing:"0.2em", color:C.textDark }}>{l}</div><div style={{ fontSize:11, color:C.text, fontFamily:mono, marginTop:2 }}>{val}</div></div>
                        ))}
                      </div>
                      {v.value > 0 && <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid rgba(255,255,255,0.06)`, fontSize:16, color:C.goldBright, fontFamily:mono, fontWeight:500 }}>{fmtVal(v.value)}</div>}
                      {Array.isArray(v.value_history) && v.value_history.length > 1 && (() => {
                        const vals = v.value_history.map(p => p.v);
                        const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
                        return (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>WAARDE-EVOLUTIE</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 36 }}>
                              {v.value_history.map((p, i) => (
                                <div key={i} title={`${p.d}: ${fmtVal(p.v)}`}
                                  style={{ flex: 1, height: `${20 + ((p.v - min) / span) * 80}%`, background: i === v.value_history.length - 1 ? C.gold : C.goldDim, borderRadius: 2 }} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      {v.condition_score != null && (
                        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: mono }}>
                          <span style={{ color: C.textDark, letterSpacing: "0.2em" }}>CONDITIE</span>
                          <span style={{ color: C.goldBright }}>{v.condition_score}/100</span>
                        </div>
                      )}
                      {Array.isArray(v.documents) && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>DOCUMENTEN</div>
                          {v.documents.map((d, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text, padding: "2px 0" }}>
                              <span>{d.type}</span><span style={{ color: C.textMuted, fontFamily: mono }}>{d.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* ── AI-WAARDERING ── */}
                      {(() => {
                        const val = valuations[v.id];
                        if (!val) return null;
                        const impactDot = (impact) => {
                          const col = impact === "positief" ? C.green : impact === "negatief" ? C.red : C.textDark;
                          return <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:col, flexShrink:0, marginTop:2 }} />;
                        };
                        const sourceLabel = val.source === "claude" ? "Claude" : val.source === "offline-fallback" ? "AI-simulatie (terugval)" : "AI-simulatie";
                        const trendColor  = val.trendPct >= 0 ? C.green : C.red;
                        const trendArrow  = val.trendPct >= 0 ? "▲" : "▼";
                        return (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                            {/* Koptekst */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div style={{ fontSize:8, letterSpacing:"0.2em", color:C.textDark }}>AI-WAARDERING</div>
                              <span style={{ fontSize:8, fontFamily:mono, letterSpacing:"0.12em", padding:"1px 6px", borderRadius:3,
                                background: val.source === "claude" ? C.goldSubtle : "rgba(255,255,255,0.04)",
                                color: val.source === "claude" ? C.gold : C.textDark,
                                border: `1px solid ${val.source === "claude" ? C.goldDim : "rgba(255,255,255,0.06)"}` }}>
                                {sourceLabel.toUpperCase()}
                              </span>
                            </div>
                            {/* Geschatte waarde + trend */}
                            <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
                              <span style={{ fontSize:18, fontFamily:mono, fontWeight:500, color:C.goldBright }}>{fmtVal(val.estimatedValue)}</span>
                              <span style={{ fontSize:11, fontFamily:mono, color:trendColor }}>
                                {trendArrow} {Math.abs(val.trendPct).toFixed(1).replace(".",",")}%
                              </span>
                            </div>
                            {/* Betrouwbaarheid */}
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                              <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${val.confidence}%`, background:`${C.gold}80`, borderRadius:2 }} />
                              </div>
                              <span style={{ fontSize:9, fontFamily:mono, color:C.textMuted, whiteSpace:"nowrap" }}>
                                {val.confidence}% betrouwbaar
                              </span>
                            </div>
                            {/* Factoren */}
                            <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                              {val.factors.map((f, i) => (
                                <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                                  {impactDot(f.impact)}
                                  <span style={{ fontSize:9, color:C.textMuted, lineHeight:1.4 }}>
                                    <span style={{ color:C.text, fontFamily:mono }}>{f.label}</span>
                                    {" — "}{f.detail}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {/* Narratief */}
                            <div style={{ fontSize:10, color:C.textDark, lineHeight:1.5, fontStyle:"italic" }}>
                              {val.narrative}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SERVICES ── */}
          {nav === "services" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {services.length === 0 && <p style={{ color:C.textMuted }}>Geen services gevonden</p>}
              {services.map(s => (
                <div key={s.id} onClick={()=>setSelectedService(s)} style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"18px 20px", cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#161616"} onMouseLeave={e=>e.currentTarget.style.background=C.panel}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ fontSize:16, color:C.white }}>{s.type}</div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, lineHeight:1.5 }}>{s.description}</div>
                  <div style={{ display:"flex", gap:16, fontSize:10, color:C.textDark, fontFamily:mono }}>
                    <span>{s.date}</span>
                    {s.technician && <span>{s.technician}</span>}
                    {s.estimated_cost > 0 && <span style={{ color:C.gold }}>€{Number(s.estimated_cost).toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FACTUREN ── */}
          {nav === "facturen" && (() => {
            const filtered = invoiceFilter === "all" ? invoices : invoices.filter(i=>i.status===invoiceFilter);
            const totalOpen = invoices.filter(i=>i.status==="pending"||i.status==="overdue").reduce((s,i)=>s+(i.amount??0),0);
            return (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                  {totalOpen > 0 && <div style={{ fontSize:12, color:C.red, fontFamily:mono }}>Openstaand: €{totalOpen.toLocaleString()}</div>}
                  <div style={{ display:"flex", gap:6 }}>
                    {["all","paid","pending","overdue"].map(f=>(
                      <div key={f} onClick={()=>setInvoiceFilter(f)} style={{ padding:"5px 12px", fontSize:10, fontFamily:mono, cursor:"pointer", borderRadius:4, border:`1px solid ${invoiceFilter===f?C.gold:"rgba(255,255,255,0.08)"}`, color:invoiceFilter===f?C.gold:C.textMuted, background:invoiceFilter===f?C.goldSubtle:"transparent" }}>
                        {f==="all"?"ALLE":f==="paid"?"BETAALD":f==="pending"?"OPEN":"ACHTERSTALLIG"}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filtered.map(inv=>(
                    <div key={inv.id} onClick={()=>setSelectedInvoice(inv)} style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"16px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#161616"} onMouseLeave={e=>e.currentTarget.style.background=C.panel}>
                      <div>
                        <div style={{ fontSize:13, color:C.white }}>{inv.type}</div>
                        <div style={{ fontSize:10, color:C.textMuted, fontFamily:mono, marginTop:3 }}>{inv.period||inv.date}</div>
                        {inv.description && <div style={{ fontSize:10, color:C.textDark, marginTop:2 }}>{inv.description}</div>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                        <div style={{ fontSize:16, color:C.goldBright, fontFamily:mono, fontWeight:500 }}>€{(inv.amount??0).toLocaleString()}</div>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── PORTFOLIO ── */}
          {nav === "portfolio" && (() => {
            // ── aggregates ──
            const mVehicles = vehicles.filter(v => v.client_id === clientId || true); // already filtered on load
            const sumCurrent  = mVehicles.reduce((s, v) => s + (v.current_value ?? v.value ?? 0), 0);
            const sumPurchase = mVehicles.reduce((s, v) => s + (v.purchase_value ?? 0), 0);
            const meerwaarde  = sumCurrent - sumPurchase;
            const meerPct     = sumPurchase ? (meerwaarde / sumPurchase) * 100 : 0;
            const totalInvoices  = invoices.reduce((s, i) => s + (i.amount ?? 0), 0);
            const totalServices  = services.reduce((s, sv) => s + (sv.estimated_cost ?? 0), 0);
            const totalCosts     = totalInvoices + totalServices;

            // ── build summed time-series ──
            // All vehicles now share the same 15 monthly dates (2025-04 → 2026-06)
            const dateSet = new Map();
            mVehicles.forEach(v => {
              (v.value_history || []).forEach(p => {
                dateSet.set(p.d, (dateSet.get(p.d) ?? 0) + p.v);
              });
            });
            // Sort chronologically
            const series = Array.from(dateSet.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([d, v]) => ({ d, v }));

            // ── SVG chart geometry ──
            const PAD = { top: 28, right: 18, bottom: 36, left: 18 };
            const VW = 880; const VH = 170; // viewBox units — breed & laag voor een compacte grafiek
            const chartW = VW - PAD.left - PAD.right;
            const chartH = VH - PAD.top - PAD.bottom;
            const seriesVals = series.map(p => p.v);
            const minV = Math.min(...seriesVals);
            const maxV = Math.max(...seriesVals);
            const span = maxV - minV || 1;

            const xOf = (i) => PAD.left + (i / (series.length - 1)) * chartW;
            const yOf = (v) => PAD.top + chartH - ((v - minV) / span) * chartH;

            const pts = series.map((p, i) => `${xOf(i)},${yOf(p.v)}`).join(" ");
            // Area path: line down to baseline and back
            const firstX = xOf(0), lastX = xOf(series.length - 1), baseY = PAD.top + chartH;
            const areaPath = `M ${firstX},${baseY} L ${pts.split(" ").map(pt => pt).join(" L ")} L ${lastX},${baseY} Z`;
            // Rewrite as M firstX,baseY L points L lastX,baseY Z
            const areaD = `M ${firstX},${baseY} ${series.map((p, i) => `L ${xOf(i)},${yOf(p.v)}`).join(" ")} L ${lastX},${baseY} Z`;
            const lineD = series.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i)},${yOf(p.v)}`).join(" ");

            // Min / max annotation positions
            const maxIdx = seriesVals.indexOf(maxV);
            const minIdx = seriesVals.indexOf(minV);

            const startVal = series[0]?.v ?? 0;
            const endVal   = series[series.length - 1]?.v ?? 0;
            const chartPct = startVal ? ((endVal - startVal) / startVal) * 100 : 0;

            // ── verdeling per wagen ──
            const sortedVeh = [...mVehicles].sort((a, b) =>
              (b.current_value ?? b.value ?? 0) - (a.current_value ?? a.value ?? 0));

            return (
              <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:880, margin:"0 auto", width:"100%" }}>

                {/* ── KERNCIJFERS ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { label:"COLLECTIEWAARDE", value: fmtVal(sumCurrent), color: C.goldBright },
                    { label:"GEÏNVESTEERD",    value: fmtVal(sumPurchase), color: C.text },
                    { label:"ONGEREALISEERDE MEERWAARDE",
                      value: `${meerwaarde >= 0 ? "+" : ""}${fmtVal(Math.abs(meerwaarde))}`,
                      sub:   `${meerwaarde >= 0 ? "▲" : "▼"} ${Math.abs(meerPct).toFixed(1).replace(".",",")}%`,
                      color: meerwaarde >= 0 ? C.green : C.red },
                    { label:"TOTALE KOSTEN",   value: fmtVal(totalCosts), color: C.text },
                  ].map((item, i) => (
                    <div key={i} style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"16px 18px" }}>
                      <div style={{ fontSize:7, letterSpacing:"0.22em", color:C.textDark, fontFamily:mono, marginBottom:8 }}>{item.label}</div>
                      <div style={{ fontSize:20, fontFamily:serif, color:item.color, lineHeight:1 }}>{item.value}</div>
                      {item.sub && <div style={{ fontSize:10, fontFamily:mono, color:item.color, marginTop:4, opacity:0.8 }}>{item.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* ── COLLECTIEWAARDE-EVOLUTIE ── */}
                <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:14, padding:"20px 18px" }}>
                  <div style={{ fontSize:8, letterSpacing:"0.25em", color:C.textMuted, fontFamily:mono, marginBottom:14 }}>COLLECTIEWAARDE-EVOLUTIE</div>
                  <svg
                    viewBox={`0 0 ${VW} ${VH}`}
                    preserveAspectRatio="xMidYMid meet"
                    width="100%"
                    style={{ display:"block", overflow:"visible" }}
                  >
                    <defs>
                      <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C.gold} stopOpacity="0.28"/>
                        <stop offset="100%" stopColor={C.gold} stopOpacity="0.02"/>
                      </linearGradient>
                    </defs>
                    {/* Baseline */}
                    <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH}
                      stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                    {/* Area fill */}
                    <path d={areaD} fill="url(#goldArea)"/>
                    {/* Line */}
                    <path d={lineD} fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                    {/* Max dot + label */}
                    <circle cx={xOf(maxIdx)} cy={yOf(maxV)} r="3" fill={C.goldBright}/>
                    <text x={xOf(maxIdx)} y={yOf(maxV) - 7} textAnchor="middle"
                      fill={C.goldBright} fontSize="7" fontFamily={mono}>{fmtVal(maxV)}</text>
                    {/* First date label */}
                    <text x={PAD.left} y={PAD.top + chartH + 14} textAnchor="start"
                      fill={C.textDark} fontSize="7" fontFamily={mono}>{series[0]?.d}</text>
                    {/* Last date label */}
                    <text x={PAD.left + chartW} y={PAD.top + chartH + 14} textAnchor="end"
                      fill={C.textDark} fontSize="7" fontFamily={mono}>{series[series.length - 1]?.d}</text>
                    {/* Last value dot */}
                    <circle cx={xOf(series.length - 1)} cy={yOf(endVal)} r="3.5" fill={C.goldBright}/>
                  </svg>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8, paddingTop:10, borderTop:`1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ fontSize:10, color:C.textDark, fontFamily:mono }}>{series[0]?.d} → {series[series.length-1]?.d}</div>
                    <div style={{ fontSize:11, fontFamily:mono, color: chartPct >= 0 ? C.green : C.red }}>
                      {chartPct >= 0 ? "▲" : "▼"} {Math.abs(chartPct).toFixed(1).replace(".",",")}% — {fmtVal(startVal)} → {fmtVal(endVal)}
                    </div>
                  </div>
                </div>

                {/* ── VERDELING PER WAGEN ── */}
                <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:14, padding:"20px 18px" }}>
                  <div style={{ fontSize:8, letterSpacing:"0.25em", color:C.textMuted, fontFamily:mono, marginBottom:14 }}>VERDELING PER WAGEN</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {sortedVeh.map(v => {
                      const cv = v.current_value ?? v.value ?? 0;
                      const pct = sumCurrent ? (cv / sumCurrent) * 100 : 0;
                      const brand = v.models?.brands?.name ?? "—";
                      const model = v.models?.name ?? "—";
                      return (
                        <div key={v.id}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
                            <div>
                              <span style={{ fontSize:8, letterSpacing:"0.18em", color:C.textDark, fontFamily:mono }}>{brand.toUpperCase()} </span>
                              <span style={{ fontSize:11, color:C.text }}>{model}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                              <span style={{ fontSize:13, fontFamily:mono, color:C.goldBright }}>{fmtVal(cv)}</span>
                              <span style={{ fontSize:9, fontFamily:mono, color:C.textDark }}>{pct.toFixed(1).replace(".",",")}%</span>
                            </div>
                          </div>
                          <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${C.goldBright}, ${C.gold})`, borderRadius:2, transition:"width 0.6s ease" }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── CONDITIE & GEBRUIK ── */}
                <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:14, padding:"20px 18px" }}>
                  <div style={{ fontSize:8, letterSpacing:"0.25em", color:C.textMuted, fontFamily:mono, marginBottom:14 }}>CONDITIE &amp; GEBRUIK</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {sortedVeh.map(v => {
                      const score = v.condition_score ?? 0;
                      const brand = v.models?.brands?.name ?? "—";
                      const model = v.models?.name ?? "—";
                      return (
                        <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:9, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              <span style={{ fontSize:7, letterSpacing:"0.15em", color:C.textDark, fontFamily:mono }}>{brand.toUpperCase()} </span>{model}
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <div style={{ width:60, height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${score}%`, background: score >= 95 ? C.green : score >= 85 ? C.gold : C.orange, borderRadius:2 }}/>
                            </div>
                            <span style={{ fontSize:9, fontFamily:mono, color:C.goldBright, width:32, textAlign:"right" }}>{score}/100</span>
                          </div>
                          <div style={{ fontSize:9, fontFamily:mono, color:C.textDark, width:64, textAlign:"right", flexShrink:0 }}>{v.mileage || "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ── BERICHTEN ── */}
          {nav === "berichten" && (
            <div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                <Btn primary onClick={()=>setComposeOpen(true)}>+ NIEUW BERICHT</Btn>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {messages.length === 0 && <p style={{ color:C.textMuted }}>Geen berichten</p>}
                {messages.map(m=>(
                  <div key={m.id} style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"16px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {!m.read && m.direction==="outgoing" && <div style={{ width:6,height:6,borderRadius:"50%",background:C.gold,flexShrink:0 }}/>}
                        <span style={{ fontSize:13, color:C.white }}>{m.subject}</span>
                        <span style={{ fontSize:9, fontFamily:mono, padding:"1px 6px", background: m.direction==="outgoing"?C.goldSubtle:C.greenBg, color:m.direction==="outgoing"?C.gold:C.green, borderRadius:3 }}>
                          {m.direction==="outgoing"?"VAN RAÚ":"UW BERICHT"}
                        </span>
                      </div>
                      <span style={{ fontSize:9, color:C.textDark, fontFamily:mono, flexShrink:0 }}>{formatRelTime(m.created_at)}</span>
                    </div>
                    <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.6 }}>{m.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modals for section views */}
        <Modal open={!!selectedService} onClose={()=>setSelectedService(null)} title="SERVICE DETAIL">
          {selectedService && <div>
            <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}><StatusBadge status={selectedService.status}/></div>
            <div style={{ fontSize:18,color:C.white,marginBottom:8 }}>{selectedService.type}</div>
            <div style={{ fontSize:13,color:C.textMuted,marginBottom:20,lineHeight:1.6 }}>{selectedService.description}</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[["DATUM",selectedService.date],["TECHNICUS",selectedService.technician||"—"],["WAGEN",`${selectedService.vehicles?.models?.brands?.name||""} ${selectedService.vehicles?.models?.name||""}`.trim()||"—"],["GESCHATTE KOST",`€${(selectedService.estimated_cost??0).toLocaleString()}`]].map(([l,v],i)=>(
                <div key={i} style={{ padding:"12px 14px",background:C.surface,borderRadius:6 }}>
                  <div style={{ fontSize:8,letterSpacing:"0.2em",color:C.textDark }}>{l}</div>
                  <div style={{ fontSize:13,color:C.text,fontFamily:mono,marginTop:3 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>}
        </Modal>
        <Modal open={!!selectedInvoice} onClose={()=>setSelectedInvoice(null)} title="FACTUUR DETAIL">
          {selectedInvoice && <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:28,color:C.goldBright,fontFamily:mono,fontWeight:500 }}>€{(selectedInvoice.amount??0).toLocaleString()}</div>
              <StatusBadge status={selectedInvoice.status}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[["TYPE",selectedInvoice.type],["DATUM",selectedInvoice.date],["PERIODE",selectedInvoice.period||"—"],["BESCHRIJVING",selectedInvoice.description||"—"]].map(([l,v],i)=>(
                <div key={i} style={{ padding:"12px 14px",background:C.surface,borderRadius:6 }}>
                  <div style={{ fontSize:8,letterSpacing:"0.2em",color:C.textDark }}>{l}</div>
                  <div style={{ fontSize:13,color:C.text,marginTop:3 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>}
        </Modal>
        <Modal open={composeOpen} onClose={()=>setComposeOpen(false)} title="BERICHT STUREN AAN RAÚ" width={520}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div><div style={{ fontSize:9,letterSpacing:"0.2em",color:C.textDark,marginBottom:6 }}>ONDERWERP</div><input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Onderwerp..." style={inputSt}/></div>
            <div><div style={{ fontSize:9,letterSpacing:"0.2em",color:C.textDark,marginBottom:6 }}>BERICHT</div><textarea value={composeBody} onChange={e=>setComposeBody(e.target.value)} rows={5} placeholder="Typ uw bericht..." style={{ ...inputSt, lineHeight:1.6, resize:"vertical" }}/></div>
            <div style={{ display:"flex",gap:10 }}>
              <Btn primary onClick={sendMessage} style={{ flex:1 }}>VERSTUREN</Btn>
              <Btn onClick={()=>setComposeOpen(false)} style={{ flex:1 }}>ANNULEREN</Btn>
            </div>
          </div>
        </Modal>
        {/* ─── BOTTOM TAB BAR ─── */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, height:56, background:"rgba(8,8,8,0.92)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"stretch", zIndex:100 }}>
          {[["Overzicht","dashboard"],["Wagens","wagens"],["Services","services"],["Berichten","berichten"]].map(([label,id])=>{
            const active = id === "dashboard" ? nav === "dashboard" : nav === id;
            return (
              <div key={id} onClick={()=>setNav(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:2, transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <span style={{ fontSize:9, letterSpacing:"0.18em", fontFamily:mono, color: active ? "#a0b27e" : "#6a6a64", fontWeight: active ? 500 : 400 }}>{label.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     DASHBOARD — matches screenshot exactly
     ═══════════════════════════════════════════ */
  if (loading) return <div style={{ height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:mono,fontSize:11,color:C.textDark,letterSpacing:"0.2em" }}>LADEN...</div>;

  return (
    <div style={{ width:"100%", height:"100vh", background:C.bg, color:C.white, fontFamily:sans, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@200;300;400;500;600&family=Cormorant+Garamond:wght@300;400;500&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box} ::-webkit-scrollbar{display:none} input::placeholder,textarea::placeholder{color:#3e3e3a} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ─── HEADER ─── */}
      <header style={{ height:52, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", zIndex:10, position:"relative" }}>
        <span style={{ fontFamily:serif, fontSize:22, fontWeight:400, color:C.white, letterSpacing:"0.05em" }}>raù</span>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          {/* Moon icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          {/* Toggle — decorative dark mode indicator */}
          <div style={{ width:36, height:20, borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", position:"relative", cursor:"default" }}>
            <div style={{ position:"absolute", right:3, top:3, width:14, height:14, borderRadius:"50%", background:"rgba(255,255,255,0.5)" }}/>
          </div>
          {/* Mail icon */}
          <div onClick={()=>setNav("berichten")} style={{ position:"relative", cursor:"pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            {unread > 0 && <div style={{ position:"absolute", top:-4, right:-4, width:14, height:14, borderRadius:"50%", background:"#c45050", fontSize:8, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:mono }}>{unread}</div>}
          </div>
          {/* Profile icon */}
          <div onClick={()=>setProfileOpen(p=>!p)} style={{ position:"relative", cursor:"pointer" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            {/* Profile dropdown */}
            {profileOpen && (
              <div style={{ position:"absolute", top:40, right:0, width:220, background:"rgba(18,18,18,0.97)", border:`1px solid rgba(255,255,255,0.08)`, borderRadius:12, padding:"14px 0", zIndex:200, backdropFilter:"blur(20px)", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
                <div style={{ padding:"8px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:13, color:C.white }}>{client?.name || user?.email}</div>
                  <div style={{ fontSize:10, color:C.textDark, fontFamily:mono, marginTop:3 }}>{client?.tier ? `${client.tier} klant` : "Klant"}</div>
                </div>
                {[["⬡","Mijn Wagens","wagens"],["○","Services","services"],["□","Facturen","facturen"],["✉","Berichten","berichten"]].map(([icon,label,id])=>(
                  <div key={id} onClick={()=>{ setNav(id); setProfileOpen(false); }} style={{ padding:"10px 18px", fontSize:13, color:C.textMuted, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=C.white}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted}}>
                    <span style={{ opacity:0.4, fontSize:13 }}>{icon}</span>{label}
                  </div>
                ))}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:4 }}>
                  <div onClick={onSignOut} style={{ padding:"10px 18px", fontSize:13, color:"#c45050", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(196,80,80,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    Uitloggen
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <div style={{ height:"52vh", maxHeight:460, position:"relative", overflow:"hidden", flexShrink:0 }}>

        {/* Afbeelding modus */}
        {displayMode === "image" ? (
          <>
            {/* Placeholder ligt eronder; foto bedekt hem indien geladen, en valt hierop terug bij ontbrekend/kapot bestand */}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:60, opacity:0.05 }}>◻</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.12)", fontFamily:mono, letterSpacing:"0.2em", marginTop:10 }}>GEEN AFBEELDING</div>
              </div>
            </div>
            {imageUrl && (
              <>
                <img src={imageUrl} alt={`${brandName} ${modelName}`}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center",
                    filter:"saturate(0.9) contrast(1.05) brightness(0.88)" }} />
                {/* Cinematografische behandeling: verloop boven/onder + vignette unificeert de uiteenlopende
                    bronfoto's, verbetert leesbaarheid en doezelt hoek-watermerken/achtergronden weg. */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none",
                  background:"linear-gradient(to bottom, rgba(8,8,8,0.6) 0%, rgba(8,8,8,0) 24%, rgba(8,8,8,0) 52%, rgba(8,8,8,0.92) 100%)" }} />
                <div style={{ position:"absolute", inset:0, pointerEvents:"none",
                  background:"radial-gradient(125% 95% at 50% 42%, rgba(8,8,8,0) 52%, rgba(8,8,8,0.78) 100%)" }} />
              </>
            )}
          </>
        ) : (
          <>
            {/* 3D canvas */}
            <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}/>
            {/* No model placeholder */}
            {!modelUrl && (
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:60, opacity:0.05 }}>⬡</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.12)", fontFamily:mono, letterSpacing:"0.2em", marginTop:10 }}>GEEN 3D MODEL</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Subtle vignette */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2, background:"radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,8,8,0.55) 100%)" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:160, background:"linear-gradient(transparent, rgba(8,8,8,0.9))", pointerEvents:"none", zIndex:2 }}/>

        {/* Welcome text — top left */}
        <div style={{ position:"absolute", top:28, left:36, zIndex:5, animation:"fadeUp 0.7s ease both" }}>
          <div style={{ fontSize:36, fontWeight:300, color:C.white, letterSpacing:"-0.01em", lineHeight:1.1 }}>
            Welkom terug, {firstName}
          </div>
        </div>

        {/* Value — top right */}
        {vehicle?.value > 0 && (
          <div style={{ position:"absolute", top:28, right:36, zIndex:5, textAlign:"right", animation:"fadeUp 0.7s ease 0.1s both" }}>
            <div style={{ fontSize:9, letterSpacing:"0.25em", color:"rgba(255,255,255,0.35)", fontFamily:mono, marginBottom:4 }}>WAARDE</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
              <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderBottom:`7px solid ${C.gold}`, marginBottom:2 }}/>
              <span style={{ fontSize:24, color:C.white, fontFamily:sans, fontWeight:300 }}>{fmtVal(vehicle.value)}</span>
            </div>
          </div>
        )}

        {/* Car name — bottom left */}
        <div style={{ position:"absolute", bottom:24, left:36, zIndex:5, animation:"fadeUp 0.7s ease 0.15s both" }}>
          <div style={{ fontSize:10, letterSpacing:"0.3em", color:"rgba(255,255,255,0.3)", fontFamily:mono, marginBottom:6 }}>IN FOCUS</div>
          <div style={{ fontSize:36, fontFamily:serif, fontWeight:400, color:C.white, lineHeight:1, marginBottom:10 }}>
            {brandName} {modelName || "—"}
          </div>
          {vehicle?.status && <StatusBadge status={vehicle.status}/>}
        </div>

        {/* Action buttons — bottom right */}
        <div style={{ position:"absolute", bottom:28, right:36, zIndex:5, display:"flex", gap:10 }}>
          <div onClick={()=>setNav("wagens")} title="Mijn wagens" style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div onClick={()=>setNav("services")} title="Services" style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
          </div>
        </div>

        {/* Vehicle carousel dots */}
        {vehicles.length > 1 && (
          <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:5, display:"flex", gap:8, alignItems:"center" }}>
            {vehicles.map((_, i) => (
              <div key={i} onClick={()=>setCarIdx(i)} style={{ width: i===carIdx ? 20 : 6, height:6, borderRadius:3, background: i===carIdx ? C.gold : "rgba(255,255,255,0.2)", cursor:"pointer", transition:"all 0.3s" }}/>
            ))}
          </div>
        )}
      </div>

      {/* ─── COLLECTION VALUE ─── */}
      <div style={{ flexShrink:0, padding:"0 10px 6px" }}>
        <div onClick={() => setNav("portfolio")} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 14, padding: "20px 22px", marginTop: 14, cursor:"pointer", transition:"border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.goldDim}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.panelBorder}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: C.textMuted, fontFamily: mono }}>TOTALE COLLECTIEWAARDE</div>
            <div style={{ fontSize: 9, fontFamily: mono, color: C.goldDim, letterSpacing:"0.12em" }}>Bekijk portfolio ›</div>
          </div>
          <div style={{ fontSize: 30, fontFamily: serif, color: C.goldBright, marginTop: 6 }}>{fmtVal(totalValue)}</div>
          <div style={{ fontSize: 11, fontFamily: mono, marginTop: 4, color: valueDelta >= 0 ? C.green : C.red }}>
            {valueDelta >= 0 ? "▲" : "▼"} {fmtVal(Math.abs(valueDelta))} ({valuePct.toFixed(1).replace(".", ",")}%) sinds aankoop
          </div>
          <div style={{ fontSize: 9, color: C.textDark, marginTop: 8 }}>{vehicles.length} wagens in beheer</div>
        </div>
      </div>

      {/* ─── BOTTOM PANELS ─── */}
      <div style={{ height:200, flexShrink:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"8px 10px 66px" }}>

        {/* INFO */}
        <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"18px 22px", display:"flex", flexDirection:"column", gap:10, overflow:"hidden" }}>
          <div style={{ fontSize:9, letterSpacing:"0.28em", color:"rgba(255,255,255,0.25)", fontFamily:mono }}>INFO</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:18, color:C.white, fontFamily:mono, fontWeight:400 }}>{vehicle?.plate || "—"}</span>
            {vehicle?.color && (
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"rgba(255,255,255,0.25)" }}/>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"rgba(255,255,255,0.15)" }}/>
              </div>
            )}
            <span style={{ fontSize:14, color:C.textMuted, fontFamily:mono }}>{vehicle?.mileage || "—"}</span>
          </div>
          <div>
            <div style={{ fontSize:9, letterSpacing:"0.15em", color:C.textDark, fontFamily:mono, marginBottom:3 }}>
              {vehicle?.color ? vehicle.color.toUpperCase() : "KLEUR ONBEKEND"}
            </div>
            <div style={{ fontSize:10, color:C.textMuted, fontFamily:mono }}>
              {vehicle?.next_service ? `Service: ${vehicle.next_service}` : "Geen service gepland"}
            </div>
          </div>
        </div>

        {/* VANDAAG */}
        <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"18px 22px", display:"flex", flexDirection:"column", justifyContent:"space-between", overflow:"hidden" }}>
          <div style={{ fontSize:9, letterSpacing:"0.28em", color:"rgba(255,255,255,0.25)", fontFamily:mono, marginBottom:8 }}>VANDAAG</div>
          {activeService ? (
            <>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                  <div style={{ fontSize:16, color:C.white, fontWeight:400, lineHeight:1.2 }}>{activeService.type}</div>
                  <div style={{ flexShrink:0 }}><StatusBadge status={activeService.status}/></div>
                </div>
                <div style={{ fontSize:11, color:C.textMuted }}>
                  {activeService.technician || `${activeService.vehicles?.models?.brands?.name || ""} ${activeService.vehicles?.models?.name || ""}`.trim() || "—"}
                </div>
              </div>
              <div onClick={()=>setSelectedService(activeService)} style={{ marginTop:8, padding:"8px 14px", background:C.goldSubtle, border:`1px solid ${C.goldDim}`, borderRadius:6, fontSize:10, fontFamily:mono, letterSpacing:"0.12em", color:C.gold, cursor:"pointer", textAlign:"center", transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(138,154,110,0.15)"}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.goldSubtle}}>
                DETAIL BEKIJKEN
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:13, color:C.textMuted }}>Geen actieve service</div>
              <div onClick={()=>{ setComposeSubject("Afspraak aanvragen"); setComposeOpen(true); setNav("berichten"); }} style={{ marginTop:8, padding:"8px 14px", background:C.goldSubtle, border:`1px solid ${C.goldDim}`, borderRadius:6, fontSize:10, fontFamily:mono, letterSpacing:"0.12em", color:C.gold, cursor:"pointer", textAlign:"center", transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(138,154,110,0.15)"}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.goldSubtle}}>
                + AFSPRAAK PLANNEN
              </div>
            </>
          )}
        </div>

        {/* PLANNING */}
        <div style={{ background:C.panel, border:`1px solid ${C.panelBorder}`, borderRadius:12, padding:"18px 22px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
          <div style={{ fontSize:9, letterSpacing:"0.28em", color:"rgba(255,255,255,0.25)", fontFamily:mono }}>PLANNING</div>
          {plannedServices.length === 0 ? (
            <div style={{ fontSize:12, color:C.textDark }}>Geen geplande services</div>
          ) : (
            plannedServices.map((s, i) => {
              const { day, month } = nlMonth(s.date);
              return (
                <div key={s.id} style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom: i < plannedServices.length-1 ? 6 : 0 }}>
                  <div style={{ fontSize:30, color:"rgba(255,255,255,0.12)", fontWeight:300, fontFamily:mono, lineHeight:1, minWidth:32, textAlign:"right", flexShrink:0 }}>{day}</div>
                  <div>
                    <div style={{ fontSize:13, color:C.white, fontWeight:400 }}>{month}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{s.type}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── BOTTOM TAB BAR ─── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:56, background:"rgba(8,8,8,0.92)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"stretch", zIndex:100 }}>
        {[["Overzicht","dashboard"],["Wagens","wagens"],["Services","services"],["Berichten","berichten"]].map(([label,id])=>{
          const active = id === "dashboard" ? nav === "dashboard" : nav === id;
          return (
            <div key={id} onClick={()=>setNav(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:2, transition:"opacity 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <span style={{ fontSize:9, letterSpacing:"0.18em", fontFamily:mono, color: active ? "#a0b27e" : "#6a6a64", fontWeight: active ? 500 : 400 }}>{label.toUpperCase()}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
