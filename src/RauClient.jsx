import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { supabase } from "./supabase";

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
  renderer.toneMappingExposure = 1.6;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);

  // Camera — slightly back to make car feel smaller
  const cam = new THREE.PerspectiveCamera(28, w / h, 0.1, 200);
  cam.position.set(7.5, 2.6, 7.5);
  cam.lookAt(0, 0.4, 0);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.15, metalness: 0.95 })
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
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    loader.setDRACOLoader(draco);
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(6.5 / Math.max(size.x, size.y, size.z)); // slightly smaller
      const sBox = new THREE.Box3().setFromObject(model);
      const c = sBox.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -sBox.min.y, -c.z);
      model.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
      carGroup.add(model);
    });
  }

  // Controls
  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.minDistance = 5; controls.maxDistance = 18;
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0.5, 0);
  controls.autoRotate = true; controls.autoRotateSpeed = 0.9;

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

  useEffect(() => { if (clientId) loadAll(); else setLoading(false); }, [clientId]);

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
  const modelPath = vehicle?.models?.model_3d_path ?? null;
  const modelUrl  = modelPath ? supabase.storage.from("3d-models").getPublicUrl(modelPath).data.publicUrl : null;

  useEffect(() => {
    if (loading || !canvasRef.current || nav !== "dashboard") return;
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    const result = buildScene(canvasRef.current, modelUrl);
    cleanupRef.current = result.cleanup;
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [loading, vehicle?.id, modelUrl, nav]);

  const firstName  = client?.name?.split(" ")[0] ?? "Welkom";
  const brandName  = vehicle?.models?.brands?.name ?? "";
  const modelName  = vehicle?.models?.name ?? "";
  const unread     = messages.filter(m => !m.read && m.direction === "outgoing").length;

  const activeService   = services.find(s => s.status === "in-progress" || s.status === "scheduled");
  const plannedServices = services.filter(s => s.status === "scheduled").slice(0, 3);

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
    const sectionTitle = { wagens:"MIJN WAGENS", services:"SERVICES", facturen:"FACTUREN", berichten:"BERICHTEN" }[nav];
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

        <div style={{ flex:1, overflowY:"auto", padding: 24 }}>
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
      <div style={{ flex:1, position:"relative", overflow:"hidden", minHeight:0 }}>
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

      {/* ─── BOTTOM PANELS ─── */}
      <div style={{ height:200, flexShrink:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"8px 10px 10px" }}>

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

    </div>
  );
}
