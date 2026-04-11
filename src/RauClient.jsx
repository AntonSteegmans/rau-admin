import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════
   DESIGN TOKENS (identiek aan admin)
   ═══════════════════════════════════════════ */
const C = {
  bg: "#0a0a0a", panel: "#111111", panelBorder: "#1e1e1e",
  surface: "#161616", surfaceHover: "#1c1c1c",
  accent: "#8a9a6e", accentBright: "#a0b27e", accentDim: "rgba(138,154,110,0.35)",
  accentSubtle: "rgba(138,154,110,0.08)", accentSubtle2: "rgba(138,154,110,0.15)",
  gold: "#8a9a6e", goldBright: "#a0b27e", goldDim: "rgba(138,154,110,0.35)",
  goldSubtle: "rgba(138,154,110,0.08)",
  white: "#e8e8e4", text: "#b0b0a8", textMuted: "#6a6a64", textDark: "#3e3e3a",
  red: "#c45050", redBg: "rgba(196,80,80,0.06)",
  green: "#7a9e6a", greenBg: "rgba(122,158,106,0.06)",
  blue: "#6a8eaa", blueBg: "rgba(106,142,170,0.06)",
  orange: "#b08a5a",
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Outfit', sans-serif";

/* ─── Helpers ─── */
const fmtEuro = v => v >= 1e6 ? `€${(v / 1e6).toFixed(2)}M` : v >= 1000 ? `€${(v / 1000).toFixed(1)}K` : `€${v}`;

const formatRelTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Zojuist";
  if (h < 24) return `${h}u geleden`;
  if (d < 7) return `${d}d geleden`;
  return new Date(ts).toLocaleDateString("nl-BE");
};

const StatusBadge = ({ status }) => {
  const map = {
    active: { bg: "rgba(122,158,106,0.06)", border: "#7a9e6a40", color: "#7a9e6a", label: "Actief" },
    paused: { bg: "rgba(176,138,90,0.12)", border: "#b08a5a40", color: "#b08a5a", label: "Gepauzeerd" },
    "in-progress": { bg: "rgba(106,142,170,0.12)", border: "#6a8eaa40", color: "#6a8eaa", label: "In uitvoering" },
    scheduled: { bg: C.goldSubtle, border: C.gold + "40", color: C.gold, label: "Gepland" },
    completed: { bg: "rgba(122,158,106,0.06)", border: "#7a9e6a40", color: "#7a9e6a", label: "Voltooid" },
    cancelled: { bg: "rgba(196,80,80,0.06)", border: "#c4505040", color: "#c45050", label: "Geannuleerd" },
    garaged: { bg: C.goldSubtle, border: C.gold + "40", color: C.gold, label: "Gestald" },
    "in-service": { bg: "rgba(106,142,170,0.12)", border: "#6a8eaa40", color: "#6a8eaa", label: "In service" },
    "pickup-scheduled": { bg: "rgba(176,138,90,0.12)", border: "#b08a5a40", color: "#b08a5a", label: "Ophaling gepland" },
    paid: { bg: "rgba(122,158,106,0.06)", border: "#7a9e6a40", color: "#7a9e6a", label: "Betaald" },
    pending: { bg: C.goldSubtle, border: C.gold + "40", color: C.gold, label: "Open" },
    overdue: { bg: "rgba(196,80,80,0.06)", border: "#c4505040", color: "#c45050", label: "Achterstallig" },
    draft: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", color: C.textMuted, label: "Concept" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      padding: "3px 9px", fontSize: 9, fontFamily: mono, fontWeight: 500,
      letterSpacing: "0.12em", borderRadius: 3,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>{s.label}</span>
  );
};

const Panel = ({ children, style }) => (
  <div style={{
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, ...style,
  }}>{children}</div>
);

const Hov = ({ children, onClick, style }) => (
  <div onClick={onClick} style={{ cursor: onClick ? "pointer" : "default", transition: "background 0.15s", ...style }}
    onMouseEnter={e => onClick && (e.currentTarget.style.background = C.surfaceHover)}
    onMouseLeave={e => onClick && (e.currentTarget.style.background = "transparent")}
  >{children}</div>
);

/* ─── Mini 3D Viewer ─── */
function MiniCar({ canvas, modelUrl }) {
  useEffect(() => {
    if (!canvas || !modelUrl) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 200);
    cam.position.set(5, 2, 5);
    cam.lookAt(0, 0.3, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.SpotLight(0xffffff, 6, 30, Math.PI / 4, 0.5);
    key.position.set(6, 6, 5); key.lookAt(0, 0, 0); scene.add(key);
    const fill = new THREE.SpotLight(0xeeeeff, 3, 30, Math.PI / 3, 0.6);
    fill.position.set(-7, 4, 2); fill.lookAt(0, 0, 0); scene.add(fill);
    const rim = new THREE.SpotLight(0xffffff, 4, 25, Math.PI / 5, 0.4);
    rim.position.set(-2, 4, -7); rim.lookAt(0, 0.5, 0); scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(10, 64),
      new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.2, metalness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    loader.setDRACOLoader(draco);

    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(8 / Math.max(size.x, size.y, size.z));
      const sBox = new THREE.Box3().setFromObject(model);
      const c = sBox.getCenter(new THREE.Vector3());
      model.position.x -= c.x;
      model.position.z -= c.z;
      model.position.y -= sBox.min.y;
      scene.add(model);
    });

    const controls = new OrbitControls(cam, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false; controls.minDistance = 3; controls.maxDistance = 14;
    controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = true; controls.autoRotateSpeed = 1.0;

    let af;
    const anim = () => { af = requestAnimationFrame(anim); controls.update(); renderer.render(scene, cam); };
    anim();

    const onR = () => { cam.aspect = canvas.clientWidth / canvas.clientHeight; cam.updateProjectionMatrix(); renderer.setSize(canvas.clientWidth, canvas.clientHeight); };
    window.addEventListener("resize", onR);

    return () => { cancelAnimationFrame(af); controls.dispose(); renderer.dispose(); window.removeEventListener("resize", onR); };
  }, [canvas, modelUrl]);

  return null;
}

/* ─── Nav items ─── */
const navItems = [
  { id: "overzicht", icon: "◈", label: "Overzicht" },
  { id: "wagens", icon: "⬡", label: "Mijn Wagens" },
  { id: "services", icon: "○", label: "Services" },
  { id: "facturen", icon: "□", label: "Facturen" },
  { id: "berichten", icon: "✉", label: "Berichten" },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function ClientPortal({ user, clientId, onSignOut }) {
  const [nav, setNav] = useState("overzicht");
  const [client, setClient] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [carIdx, setCarIdx] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  useEffect(() => {
    if (clientId) loadAll();
  }, [clientId]);

  const loadAll = async () => {
    setLoading(true);
    const [cRes, vRes, sRes, iRes, mRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("vehicles").select("*, models(name, model_3d_path, year, brands(name))").eq("client_id", clientId).order("created_at"),
      supabase.from("services").select("*, vehicles(plate, models(name, brands(name)))").eq("client_id", clientId).order("date"),
      supabase.from("invoices").select("*").eq("client_id", clientId).order("date", { ascending: false }),
      supabase.from("messages").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);
    setClient(cRes.data);
    setVehicles(vRes.data ?? []);
    setServices(sRes.data ?? []);
    setInvoices(iRes.data ?? []);
    setMessages(mRes.data ?? []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) return;
    setSendingMsg(true);
    await supabase.from("messages").insert({
      client_id: clientId,
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      direction: "incoming",
      read: false,
    });
    setComposeOpen(false);
    setComposeSubject("");
    setComposeBody("");
    setSendingMsg(false);
    loadAll();
  };

  const unreadCount = messages.filter(m => !m.read && m.direction === "outgoing").length;

  const get3DUrl = (vehicle) => {
    if (!vehicle?.models?.model_3d_path) return null;
    const { data } = supabase.storage.from("3d-models").getPublicUrl(vehicle.models.model_3d_path);
    return data?.publicUrl ?? null;
  };

  const currentVehicle = vehicles[carIdx % Math.max(vehicles.length, 1)];
  const currentModelUrl = currentVehicle ? get3DUrl(currentVehicle) : null;

  /* ─── Canvas ref callback ─── */
  const setCanvasRef = (el) => {
    canvasRef.current = el;
  };

  /* ─── OVERZICHT ─── */
  const renderOverzicht = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
      {/* 3D Hero */}
      <div style={{ flex: "1 1 60%", position: "relative", minHeight: isMobile ? 260 : 380 }}>
        <canvas ref={setCanvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        {canvasRef.current && <MiniCar canvas={canvasRef.current} modelUrl={currentModelUrl} />}

        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
          background: "radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
          background: "linear-gradient(transparent, rgba(10,10,10,0.95))", pointerEvents: "none", zIndex: 4 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(rgba(10,10,10,0.5), transparent)", pointerEvents: "none", zIndex: 4 }} />

        {!currentModelUrl && (
          <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
            <div style={{ fontSize: 40, opacity: 0.08, color: C.white }}>⬡</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>GEEN 3D MODEL</div>
          </div>
        )}

        {/* Car info overlay */}
        {currentVehicle && (
          <div style={{ position: "absolute", bottom: 28, left: 28, right: 28, zIndex: 7, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(8px)", transition: "all 0.6s ease" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                {currentVehicle.models?.brands?.name?.toUpperCase() || ""}
              </div>
              <div style={{ fontSize: isMobile ? 24 : 32, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: C.white, lineHeight: 1 }}>
                {currentVehicle.models?.name || "Onbekend model"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: mono, marginTop: 6 }}>
                {currentVehicle.plate} · {currentVehicle.color || "—"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <StatusBadge status={currentVehicle.status} />
              {currentVehicle.value > 0 && (
                <div style={{ fontSize: 18, color: C.goldBright, fontFamily: mono, fontWeight: 500 }}>
                  {fmtEuro(currentVehicle.value)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carousel nav */}
        {vehicles.length > 1 && (
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 8, display: "flex", gap: 8 }}>
            <div onClick={() => setCarIdx(i => (i - 1 + vehicles.length) % vehicles.length)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>‹</div>
            <div onClick={() => setCarIdx(i => (i + 1) % vehicles.length)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>›</div>
          </div>
        )}
      </div>

      {/* Bottom panels */}
      <div style={{ flexShrink: 0, padding: isMobile ? "16px 16px 20px" : "20px 24px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
        {/* Services actief */}
        <div style={{ background: "rgba(106,142,170,0.08)", border: "1px solid rgba(106,142,170,0.12)", borderRadius: 12, padding: "18px 20px", backdropFilter: "blur(40px)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>ACTIEVE SERVICES</div>
          {services.filter(s => s.status === "in-progress" || s.status === "scheduled").slice(0, 2).map(s => (
            <Hov key={s.id} onClick={() => setSelectedService(s)} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 13, color: C.white }}>{s.type}</span>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: mono }}>{s.date}</div>
            </Hov>
          ))}
          {services.filter(s => s.status === "in-progress" || s.status === "scheduled").length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Geen actieve services</div>
          )}
        </div>

        {/* Facturen */}
        <div style={{ background: "rgba(138,154,110,0.06)", border: "1px solid rgba(138,154,110,0.1)", borderRadius: 12, padding: "18px 20px", backdropFilter: "blur(40px)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>OPENSTAANDE FACTUREN</div>
          {invoices.filter(i => i.status === "pending" || i.status === "overdue").slice(0, 2).map(inv => (
            <Hov key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 13, color: C.gold, fontFamily: mono, fontWeight: 500 }}>€{(inv.amount ?? 0).toLocaleString()}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{inv.type} · {inv.period || inv.date}</div>
            </Hov>
          ))}
          {invoices.filter(i => i.status === "pending" || i.status === "overdue").length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Geen openstaande facturen</div>
          )}
        </div>

        {/* Berichten */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px", backdropFilter: "blur(40px)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>RECENTE BERICHTEN</div>
          {messages.slice(0, 2).map(m => (
            <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 12, color: C.text }}>{m.subject}</span>
                <span style={{ fontSize: 9, color: C.textDark, fontFamily: mono }}>{formatRelTime(m.created_at)}</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.body}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Geen berichten</div>
          )}
          <div onClick={() => { setComposeOpen(true); }} style={{
            marginTop: 8, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
            fontSize: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "center",
            transition: "all 0.2s", fontFamily: mono, letterSpacing: "0.1em",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = C.white; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >+ NIEUW BERICHT</div>
        </div>
      </div>
    </div>
  );

  /* ─── WAGENS ─── */
  const renderWagens = () => (
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500, marginBottom: 20 }}>
        MIJN WAGENS ({vehicles.length})
      </div>
      {vehicles.length === 0 ? (
        <div style={{ fontSize: 13, color: C.textMuted, padding: "40px 0", textAlign: "center" }}>Geen wagens gevonden</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {vehicles.map(v => {
            const modelName = v.models?.name || "Onbekend";
            const brandName = v.models?.brands?.name || "Onbekend";
            const has3D = !!v.models?.model_3d_path;
            return (
              <Panel key={v.id} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${v.status === "in-service" ? C.blue : v.status === "pickup-scheduled" ? C.orange : C.gold}, ${C.accentDim})` }} />
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted }}>{brandName.toUpperCase()}</div>
                      <div style={{ fontSize: 20, color: C.white, fontWeight: 300, marginTop: 3 }}>{modelName}</div>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      { l: "NUMMERPLAAT", v: v.plate },
                      { l: "KLEUR", v: v.color || "—" },
                      { l: "KILOMETERSTAND", v: v.mileage || "—" },
                      { l: "VOLGENDE SERVICE", v: v.next_service || "—" },
                    ].map((d, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                        <div style={{ fontSize: 11, color: C.text, fontFamily: mono, marginTop: 2 }}>{d.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.panelBorder}20` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: has3D ? C.green : C.textDark }} />
                      <span style={{ fontSize: 10, color: has3D ? C.green : C.textMuted }}>{has3D ? "3D Model beschikbaar" : "Geen 3D model"}</span>
                    </div>
                    {v.value > 0 && (
                      <span style={{ fontSize: 15, color: C.goldBright, fontFamily: mono, fontWeight: 500 }}>{fmtEuro(v.value)}</span>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── SERVICES ─── */
  const renderServices = () => (
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500, marginBottom: 20 }}>
        SERVICE HISTORIEK
      </div>
      {services.length === 0 ? (
        <div style={{ fontSize: 13, color: C.textMuted, padding: "40px 0", textAlign: "center" }}>Geen services gevonden</div>
      ) : (
        <Panel style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1.5fr 1.5fr 1fr 0.8fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
            <span>SERVICE</span><span>WAGEN</span>
            {!isMobile && <><span>TECHNICUS</span><span>KOST</span></>}
            <span>STATUS</span>
          </div>
          {services.map(s => {
            const vName = `${s.vehicles?.models?.brands?.name || ""} ${s.vehicles?.models?.name || ""}`.trim() || s.vehicles?.plate || "—";
            return (
              <Hov key={s.id} onClick={() => setSelectedService(s)} style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1.5fr 1.5fr 1fr 0.8fr 0.8fr",
                padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: C.text }}>{s.type}</div>
                  <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, marginTop: 2 }}>{s.date}</div>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{vName}</div>
                {!isMobile && (
                  <>
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: mono }}>{s.technician || "—"}</div>
                    <div style={{ fontSize: 12, color: C.gold, fontFamily: mono }}>€{(s.estimated_cost ?? 0).toLocaleString()}</div>
                  </>
                )}
                <StatusBadge status={s.status} />
              </Hov>
            );
          })}
        </Panel>
      )}
    </div>
  );

  /* ─── FACTUREN ─── */
  const renderFacturen = () => {
    const filtered = invoiceFilter === "all" ? invoices : invoices.filter(i => i.status === invoiceFilter);
    const totalOpen = invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + (i.amount ?? 0), 0);
    return (
      <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>FACTUREN</div>
            {totalOpen > 0 && <div style={{ fontSize: 10, color: C.red, fontFamily: mono, marginTop: 3 }}>Openstaand: €{totalOpen.toLocaleString()}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "paid", "pending", "overdue"].map(f => (
              <div key={f} onClick={() => setInvoiceFilter(f)} style={{
                padding: "5px 12px", fontSize: 10, fontFamily: mono, cursor: "pointer", borderRadius: 2,
                border: `1px solid ${invoiceFilter === f ? C.gold : C.panelBorder}`,
                color: invoiceFilter === f ? C.gold : C.textMuted,
                background: invoiceFilter === f ? C.goldSubtle : "transparent", transition: "all 0.2s",
              }}>
                {f === "all" ? "ALLE" : f === "paid" ? "BETAALD" : f === "pending" ? "OPEN" : "ACHTERSTALLIG"}
              </div>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textMuted, padding: "40px 0", textAlign: "center" }}>Geen facturen</div>
        ) : (
          <Panel style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
              <span>TYPE</span><span>PERIODE</span><span>BEDRAG</span><span>STATUS</span>
            </div>
            {filtered.map(inv => (
              <Hov key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
                padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: C.text }}>{inv.type}</div>
                  {inv.description && <div style={{ fontSize: 10, color: C.textDark, marginTop: 1 }}>{inv.description}</div>}
                </div>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: mono }}>{inv.period || inv.date}</span>
                <span style={{ fontSize: 13, color: C.gold, fontFamily: mono, fontWeight: 500 }}>€{(inv.amount ?? 0).toLocaleString()}</span>
                <StatusBadge status={inv.status} />
              </Hov>
            ))}
          </Panel>
        )}
      </div>
    );
  };

  /* ─── BERICHTEN ─── */
  const renderBerichten = () => (
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>BERICHTEN</div>
        <div onClick={() => setComposeOpen(true)} style={{
          padding: "8px 18px", fontSize: 10, fontFamily: mono, letterSpacing: "0.15em",
          border: `1px solid ${C.gold}`, color: C.gold, background: C.goldSubtle,
          borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(138,154,110,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.goldSubtle; }}
        >+ NIEUW BERICHT</div>
      </div>
      {messages.length === 0 ? (
        <div style={{ fontSize: 13, color: C.textMuted, padding: "40px 0", textAlign: "center" }}>Geen berichten</div>
      ) : (
        <Panel style={{ overflow: "hidden" }}>
          {messages.map(m => (
            <div key={m.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.panelBorder}15` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ marginTop: 4 }}>
                  {m.direction === "outgoing" && !m.read
                    ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold }} />
                    : <div style={{ width: 7, height: 7, borderRadius: "50%", background: "transparent" }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: C.white, fontWeight: 400 }}>{m.subject}</span>
                      <span style={{
                        fontSize: 9, fontFamily: mono, padding: "1px 6px",
                        background: m.direction === "outgoing" ? C.goldSubtle : C.greenBg,
                        color: m.direction === "outgoing" ? C.gold : C.green,
                        border: `1px solid ${m.direction === "outgoing" ? C.gold + "30" : C.green + "30"}`,
                        borderRadius: 2,
                      }}>
                        {m.direction === "outgoing" ? "VAN RAÚ" : "UW BERICHT"}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: C.textDark, fontFamily: mono, flexShrink: 0 }}>
                      {formatRelTime(m.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>{m.body}</div>
                </div>
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );

  /* ─── MODALS ─── */
  const Modal = ({ open, onClose, title, children, width = 480 }) => {
    if (!open) return null;
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 14, padding: "28px 28px", width: "100%", maxWidth: width, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.3em", color: C.textMuted, fontFamily: mono }}>{title}</span>
            <div onClick={onClose} style={{ cursor: "pointer", color: C.textMuted, fontSize: 16, padding: 4 }}>✕</div>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const inputStyle = { width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" };
  const Btn = ({ children, onClick, primary, style }) => (
    <button onClick={onClick} style={{
      padding: "10px 18px", fontSize: 11, fontFamily: mono, fontWeight: 500, letterSpacing: "0.12em",
      border: primary ? `1px solid ${C.gold}60` : `1px solid ${C.panelBorder}`,
      background: primary ? C.goldSubtle : "transparent",
      color: primary ? C.gold : C.textMuted,
      borderRadius: 4, cursor: "pointer", transition: "all 0.2s", ...style,
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );

  /* ─── SECTIONS MAP ─── */
  const sections = { overzicht: renderOverzicht, wagens: renderWagens, services: renderServices, facturen: renderFacturen, berichten: renderBerichten };

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 11, color: C.textDark, fontFamily: mono, letterSpacing: "0.2em" }}>LADEN...</div>
    </div>
  );

  /* ─── MAIN RENDER ─── */
  return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, color: C.white, fontFamily: sans, overflow: "hidden", position: "relative", letterSpacing: "0.02em" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@200;300;400;500;600&family=Cormorant+Garamond:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;box-sizing:border-box}
        input::placeholder{color:#3e3e3a} textarea::placeholder{color:#3e3e3a} textarea{resize:vertical}
      `}</style>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 115, backdropFilter: "blur(4px)" }} />
      )}

      {/* Sidebar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 120,
        background: "rgba(14,14,14,0.97)", borderRight: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "26px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 20, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.white, letterSpacing: "0.05em" }}>raù</span>
          <div onClick={() => setMobileMenuOpen(false)} style={{ cursor: "pointer", color: C.textMuted, fontSize: 16, padding: 4 }}>✕</div>
        </div>

        <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map(it => {
            const a = nav === it.id;
            const hasNotif = it.id === "berichten" && unreadCount > 0;
            return (
              <div key={it.id} onClick={() => { setNav(it.id); setMobileMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 22px",
                color: a ? C.white : C.textMuted, fontSize: 14, fontWeight: a ? 400 : 300,
                cursor: "pointer", transition: "all 0.2s",
                background: a ? "rgba(255,255,255,0.04)" : "transparent",
                borderLeft: a ? `2px solid ${C.accent}` : "2px solid transparent",
              }}
                onMouseEnter={e => { if (!a) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e => { if (!a) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0, opacity: 0.5 }}>{it.icon}</span>
                <span style={{ letterSpacing: "0.05em", flex: 1 }}>{it.label}</span>
                {hasNotif && <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 7px", background: "rgba(196,80,80,0.06)", color: "#c45050", borderRadius: 10 }}>{unreadCount}</span>}
              </div>
            );
          })}
        </div>

        {/* User info + sign out */}
        <div style={{ padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.goldSubtle, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.gold, fontWeight: 500, fontFamily: mono, flexShrink: 0 }}>
              {(client?.avatar || (user?.email?.[0] || "?")).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client?.name || user?.email}</div>
              <div style={{ fontSize: 10, color: C.textDark, marginTop: 1 }}>{client?.tier ? `${client.tier} klant` : "Klant"}</div>
            </div>
          </div>
          <div onClick={onSignOut} style={{
            padding: "8px 14px", fontSize: 10, fontFamily: mono, letterSpacing: "0.15em",
            border: "1px solid rgba(255,255,255,0.06)", color: C.textMuted,
            borderRadius: 4, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >UITLOGGEN</div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{
          height: nav === "overzicht" ? 0 : 56, flexShrink: 0,
          display: nav === "overzicht" ? "none" : "flex",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: C.bg,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => setMobileMenuOpen(true)} style={{
              width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                <line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                <line x1="0" y1="6" x2="16" y2="6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                <line x1="0" y1="11" x2="16" y2="11" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.white }}>raù</span>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted, marginLeft: 4 }}>
              {navItems.find(n => n.id === nav)?.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Menu button overlay for dashboard */}
        {nav === "overzicht" && (
          <div onClick={() => setMobileMenuOpen(true)} style={{
            position: "fixed", top: 20, left: 20, zIndex: 100,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
              <line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
              <line x1="0" y1="6" x2="16" y2="6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
              <line x1="0" y1="11" x2="16" y2="11" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
            </svg>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{sections[nav]?.()}</div>
      </main>

      {/* Modal: Service detail */}
      <Modal open={!!selectedService} onClose={() => setSelectedService(null)} title="SERVICE DETAIL">
        {selectedService && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge status={selectedService.status} />
            </div>
            <div style={{ fontSize: 18, color: C.white, marginBottom: 8 }}>{selectedService.type}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>{selectedService.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { l: "DATUM", v: selectedService.date },
                { l: "TECHNICUS", v: selectedService.technician || "—" },
                { l: "WAGEN", v: `${selectedService.vehicles?.models?.brands?.name || ""} ${selectedService.vehicles?.models?.name || ""}`.trim() || "—" },
                { l: "GESCHATTE KOST", v: `€${(selectedService.estimated_cost ?? 0).toLocaleString()}` },
              ].map((d, i) => (
                <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                  <div style={{ fontSize: 13, color: C.text, fontFamily: mono, marginTop: 3 }}>{d.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Invoice detail */}
      <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="FACTUUR DETAIL">
        {selectedInvoice && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 26, color: C.goldBright, fontFamily: mono, fontWeight: 500 }}>
                €{(selectedInvoice.amount ?? 0).toLocaleString()}
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { l: "TYPE", v: selectedInvoice.type },
                { l: "DATUM", v: selectedInvoice.date },
                { l: "PERIODE / BESCHRIJVING", v: selectedInvoice.period || selectedInvoice.description || "—" },
                { l: "STATUS", v: selectedInvoice.status },
              ].map((d, i) => (
                <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                  <div style={{ fontSize: 13, color: C.text, marginTop: 3 }}>{d.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Compose message */}
      <Modal open={composeOpen} onClose={() => { setComposeOpen(false); setComposeSubject(""); setComposeBody(""); }} title="BERICHT STUREN AAN RAÚ" width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>ONDERWERP</div>
            <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Onderwerp..." style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>BERICHT</div>
            <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={5} placeholder="Typ uw bericht..."
              style={{ ...inputStyle, lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn primary onClick={sendMessage} style={{ flex: 1, opacity: sendingMsg || !composeSubject.trim() || !composeBody.trim() ? 0.5 : 1 }}>
              {sendingMsg ? "VERSTUREN..." : "VERSTUREN"}
            </Btn>
            <Btn onClick={() => { setComposeOpen(false); setComposeSubject(""); setComposeBody(""); }} style={{ flex: 1 }}>
              ANNULEREN
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
