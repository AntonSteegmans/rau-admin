import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */
const C = {
  bg: "#080808", panel: "#141414", panelHover: "#1c1c1c", panelBorder: "#2a2a2a",
  surface: "#1e1e1e", surfaceHover: "#262626", surfaceActive: "#303030",
  gold: "#D4A84B", goldBright: "#E8C068", goldDim: "rgba(212,168,75,0.4)",
  goldSubtle: "rgba(212,168,75,0.08)", goldSubtle2: "rgba(212,168,75,0.15)",
  white: "#F0EDE6", text: "#C8C4BB", textMuted: "#8A8680", textDark: "#5A5752",
  red: "#E8524A", redDim: "rgba(232,82,74,0.12)", redBg: "rgba(232,82,74,0.08)",
  green: "#5ABF6E", greenDim: "rgba(90,191,110,0.12)", greenBg: "rgba(90,191,110,0.08)",
  blue: "#5B9FD4", blueDim: "rgba(91,159,212,0.12)", blueBg: "rgba(91,159,212,0.08)",
  orange: "#D4885B", orangeDim: "rgba(212,136,91,0.12)",
  purple: "#9B7FD4", purpleDim: "rgba(155,127,212,0.12)",
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Outfit', sans-serif";

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */
const clients = [
  {
    id: "cl001", name: "Alexander Van den Berg", email: "alexander@vdb-holding.be", phone: "+32 475 12 34 56",
    company: "VDB Holding", tier: "Platinum", since: "2023-06-15", monthlyFee: 2500, status: "active",
    avatar: "AV", totalSpent: 84200,
    vehicles: [
      { id: "v001", name: "Huracán STO", make: "Lamborghini", year: 2025, plate: "1-ABC-123", color: "Nero Nemesis", status: "garaged", nextService: "2026-04-15", mileage: "4,820 km", value: 3640000 },
      { id: "v002", name: "911 GT3 RS", make: "Porsche", year: 2024, plate: "1-DEF-456", color: "Arctic Grey", status: "in-service", nextService: "2026-04-02", mileage: "12,340 km", value: 412000 },
    ],
  },
  {
    id: "cl002", name: "Marie-Claire Dubois", email: "mc@dubois-invest.be", phone: "+32 476 98 76 54",
    company: "Dubois Investments", tier: "Gold", since: "2024-01-10", monthlyFee: 1500, status: "active",
    avatar: "MD", totalSpent: 32400,
    vehicles: [
      { id: "v003", name: "SF90 Stradale", make: "Ferrari", year: 2023, plate: "1-GHI-789", color: "Rosso Corsa", status: "garaged", nextService: "2026-05-20", mileage: "8,450 km", value: 895000 },
    ],
  },
  {
    id: "cl003", name: "Thomas De Smedt", email: "thomas@desmedt.com", phone: "+32 479 55 44 33",
    company: "De Smedt & Partners", tier: "Platinum", since: "2023-02-20", monthlyFee: 3500, status: "active",
    avatar: "TD", totalSpent: 126800,
    vehicles: [
      { id: "v004", name: "Chiron Sport", make: "Bugatti", year: 2022, plate: "1-JKL-012", color: "Atlantic Blue", status: "garaged", nextService: "2026-06-01", mileage: "2,150 km", value: 3200000 },
      { id: "v005", name: "812 Competizione", make: "Ferrari", year: 2023, plate: "1-MNO-345", color: "Grigio Silverstone", status: "pickup-scheduled", nextService: "2026-03-28", mileage: "6,780 km", value: 680000 },
      { id: "v006", name: "AMG GT Black Series", make: "Mercedes", year: 2024, plate: "1-PQR-678", color: "Magno Grey", status: "garaged", nextService: "2026-07-15", mileage: "3,400 km", value: 520000 },
    ],
  },
  {
    id: "cl004", name: "Sophie Janssen", email: "sophie.j@outlook.be", phone: "+32 478 11 22 33",
    company: "Private", tier: "Silver", since: "2024-08-01", monthlyFee: 800, status: "active",
    avatar: "SJ", totalSpent: 8400,
    vehicles: [
      { id: "v007", name: "718 Cayman GT4", make: "Porsche", year: 2024, plate: "1-STU-901", color: "Python Green", status: "in-service", nextService: "2026-03-30", mileage: "9,200 km", value: 142000 },
    ],
  },
  {
    id: "cl005", name: "Bart Peeters", email: "bart@peeters-group.be", phone: "+32 477 66 77 88",
    company: "Peeters Group", tier: "Gold", since: "2023-11-05", monthlyFee: 1800, status: "paused",
    avatar: "BP", totalSpent: 41200,
    vehicles: [
      { id: "v008", name: "Aventador SVJ", make: "Lamborghini", year: 2022, plate: "1-VWX-234", color: "Verde Mantis", status: "garaged", nextService: "2026-08-10", mileage: "5,600 km", value: 780000 },
    ],
  },
];

const services = [
  { id: "s001", vehicleId: "v002", clientId: "cl001", type: "Full Service", desc: "Annual inspection, oil & filter change, brake check", status: "in-progress", date: "2026-03-24", tech: "Kevin M.", priority: "normal", estimatedCost: 2200 },
  { id: "s002", vehicleId: "v005", clientId: "cl003", type: "Pickup & Detailing", desc: "Pickup from client, full detailing, ceramic touch-up", status: "scheduled", date: "2026-03-28", tech: "Yannick D.", priority: "normal", estimatedCost: 890 },
  { id: "s003", vehicleId: "v007", clientId: "cl004", type: "Tire Change", desc: "Switch to summer tires — Michelin Cup 2 set", status: "in-progress", date: "2026-03-25", tech: "Kevin M.", priority: "high", estimatedCost: 3200 },
  { id: "s004", vehicleId: "v001", clientId: "cl001", type: "Full Service", desc: "6-month check, fluid top-up, diagnostic scan", status: "scheduled", date: "2026-04-15", tech: "Jonas V.", priority: "normal", estimatedCost: 1800 },
  { id: "s005", vehicleId: "v003", clientId: "cl002", type: "Storage Prep", desc: "Battery tender, tire pressure, cover installation", status: "completed", date: "2026-03-20", tech: "Yannick D.", priority: "low", estimatedCost: 350 },
  { id: "s006", vehicleId: "v004", clientId: "cl003", type: "Annual Inspection", desc: "Full Bugatti certified inspection — 2-day process", status: "scheduled", date: "2026-06-01", tech: "Kevin M.", priority: "high", estimatedCost: 8500 },
];

const team = [
  { id: "t001", name: "Kevin Martens", role: "Lead Technician", speciality: "Engine & Drivetrain", active: 2, avatar: "KM", status: "busy" },
  { id: "t002", name: "Yannick De Wolf", role: "Detailing Specialist", speciality: "Paint Correction & Ceramic", active: 1, avatar: "YD", status: "busy" },
  { id: "t003", name: "Jonas Vermeersch", role: "Technician", speciality: "Diagnostics & Electronics", active: 0, avatar: "JV", status: "available" },
  { id: "t004", name: "Lisa Claes", role: "Client Relations", speciality: "Scheduling & Communications", active: 3, avatar: "LC", status: "busy" },
];

const messages = [
  { id: "m001", clientId: "cl001", clientName: "Alexander Van den Berg", subject: "GT3 RS Service Update", preview: "Uw Porsche is binnen voor de jaarlijkse inspectie. Verwachte oplevering: vrijdag.", time: "2u geleden", read: false, direction: "outgoing" },
  { id: "m002", clientId: "cl003", clientName: "Thomas De Smedt", subject: "812 Competizione Ophaling", preview: "Graag bevestiging van het ophaaladres voor zaterdag 28/03.", time: "5u geleden", read: false, direction: "outgoing" },
  { id: "m003", clientId: "cl004", clientName: "Sophie Janssen", subject: "Vraag over banden", preview: "Zijn de Michelin Cup 2 beter dan de Pirelli Trofeo? Graag uw advies.", time: "1d geleden", read: true, direction: "incoming" },
  { id: "m004", clientId: "cl002", clientName: "Marie-Claire Dubois", subject: "Factuur februari", preview: "Bedankt voor de snelle service. Factuur is betaald.", time: "2d geleden", read: true, direction: "incoming" },
  { id: "m005", clientId: "cl001", clientName: "Alexander Van den Berg", subject: "Waarde-update collectie", preview: "Uw maandelijkse waarde-rapport is beschikbaar in uw portaal.", time: "3d geleden", read: true, direction: "outgoing" },
];

const invoices = [
  { id: "inv001", clientId: "cl001", clientName: "Alexander Van den Berg", amount: 2500, type: "Abonnement", period: "Maart 2026", status: "paid", date: "2026-03-01" },
  { id: "inv002", clientId: "cl001", clientName: "Alexander Van den Berg", amount: 3890, type: "Service", desc: "GT3 RS — Tire replacement", status: "pending", date: "2026-03-24" },
  { id: "inv003", clientId: "cl002", clientName: "Marie-Claire Dubois", amount: 1500, type: "Abonnement", period: "Maart 2026", status: "paid", date: "2026-03-01" },
  { id: "inv004", clientId: "cl003", clientName: "Thomas De Smedt", amount: 3500, type: "Abonnement", period: "Maart 2026", status: "paid", date: "2026-03-01" },
  { id: "inv005", clientId: "cl003", clientName: "Thomas De Smedt", amount: 890, type: "Service", desc: "812 Competizione — Detailing", status: "draft", date: "2026-03-28" },
  { id: "inv006", clientId: "cl004", clientName: "Sophie Janssen", amount: 800, type: "Abonnement", period: "Maart 2026", status: "overdue", date: "2026-03-01" },
  { id: "inv007", clientId: "cl004", clientName: "Sophie Janssen", amount: 3200, type: "Service", desc: "Cayman GT4 — Tire change", status: "draft", date: "2026-03-25" },
  { id: "inv008", clientId: "cl005", clientName: "Bart Peeters", amount: 1800, type: "Abonnement", period: "Maart 2026", status: "overdue", date: "2026-03-01" },
];

const revenueData = [
  { m: "Oct", rev: 28400 }, { m: "Nov", rev: 31200 }, { m: "Dec", rev: 34800 },
  { m: "Jan", rev: 29600 }, { m: "Feb", rev: 33100 }, { m: "Mar", rev: 38200 },
];

const navItems = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "clients", icon: "◇", label: "Klanten" },
  { id: "fleet", icon: "⬡", label: "Fleet" },
  { id: "services", icon: "○", label: "Services" },
  { id: "invoices", icon: "□", label: "Facturatie" },
  { id: "messages", icon: "✉", label: "Berichten" },
  { id: "team", icon: "△", label: "Team" },
  { id: "settings", icon: "⚙", label: "Instellingen" },
];

/* ═══════════════════════════════════════════
   3D CAR SCENE — GLB Model Loader
   ═══════════════════════════════════════════ */
function buildCar(canvas, modelUrl) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return () => {};

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Scene — light grey studio
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4d4d4);

  // Camera
  const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 200);
  cam.position.set(6, 2.2, 6);
  cam.lookAt(0, 0.3, 0);

  // Floor — light grey, receives shadows
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Contact shadow — soft dark ellipse painted under the car
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const ctx = shadowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 220);
  gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.4, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.08)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.01, 0);
  scene.add(contactShadow);

  // ── LIGHTING ──

  // Ambient — soft base
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // Main shadow light from above-front
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(4, 10, 4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -8;
  sunLight.shadow.camera.right = 8;
  sunLight.shadow.camera.top = 8;
  sunLight.shadow.camera.bottom = -8;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 25;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  // Front-right key
  const keyLight = new THREE.SpotLight(0xffffff, 3.0, 30, Math.PI / 4, 0.6);
  keyLight.position.set(6, 6, 5);
  keyLight.lookAt(0, 0, 0);
  scene.add(keyLight);

  // Left fill
  const fillLight = new THREE.SpotLight(0xeeeeff, 2.0, 30, Math.PI / 3, 0.7);
  fillLight.position.set(-7, 5, 2);
  fillLight.lookAt(0, 0, 0);
  scene.add(fillLight);

  // Back rim
  const rimLight = new THREE.SpotLight(0xffffff, 2.5, 25, Math.PI / 5, 0.5);
  rimLight.position.set(-2, 4, -7);
  rimLight.lookAt(0, 0.5, 0);
  scene.add(rimLight);

  // Top soft
  const topLight = new THREE.PointLight(0xffffff, 1.5, 25);
  topLight.position.set(0, 12, 0);
  scene.add(topLight);

  // ── LOAD MODEL ──
  const carGroup = new THREE.Group();
  scene.add(carGroup);

  if (modelUrl) {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Scale to fill viewport
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 8.0 / maxDim;
        model.scale.setScalar(scale);

        // Center and ground
        const sBox = new THREE.Box3().setFromObject(model);
        const sCenter = sBox.getCenter(new THREE.Vector3());
        model.position.x -= sCenter.x;
        model.position.z -= sCenter.z;
        model.position.y -= sBox.min.y;

        // Shadows on every mesh
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        carGroup.add(model);
        console.log('Model loaded!', size);
      },
      (p) => { if (p.total) console.log(`Loading: ${Math.round(p.loaded / p.total * 100)}%`); },
      (err) => console.error('GLB error:', err)
    );
  }

  // ── ANIMATION ──
  let mx = 0, af, tr = 0, cr = 0;
  const onM = e => { const rc = canvas.getBoundingClientRect(); mx = ((e.clientX - rc.left) / rc.width - 0.5) * 2; };
  canvas.addEventListener("mousemove", onM);
  const anim = () => {
    af = requestAnimationFrame(anim);
    tr = Math.sin(Date.now() * 0.0002) * 0.4 + mx * 0.6;
    cr += (tr - cr) * 0.02;
    carGroup.rotation.y = cr;
    renderer.render(scene, cam);
  };
  anim();
  const onR = () => { const nw = canvas.clientWidth, nh = canvas.clientHeight; cam.aspect = nw / nh; cam.updateProjectionMatrix(); renderer.setSize(nw, nh); };
  window.addEventListener("resize", onR);
  return () => { cancelAnimationFrame(af); canvas.removeEventListener("mousemove", onM); window.removeEventListener("resize", onR); renderer.dispose(); };
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const fmtEuro = v => v >= 1e6 ? `€${(v / 1e6).toFixed(2)}M` : v >= 1000 ? `€${(v / 1000).toFixed(1)}K` : `€${v}`;

const StatusBadge = ({ status }) => {
  const map = {
    active: { bg: C.greenBg, border: C.green + "40", color: C.green, label: "Actief" },
    paused: { bg: C.orangeDim, border: C.orange + "40", color: C.orange, label: "Gepauzeerd" },
    "in-progress": { bg: C.blueBg, border: C.blue + "40", color: C.blue, label: "In uitvoering" },
    scheduled: { bg: C.goldSubtle, border: C.gold + "40", color: C.gold, label: "Gepland" },
    completed: { bg: C.greenBg, border: C.green + "40", color: C.green, label: "Voltooid" },
    garaged: { bg: C.greenBg, border: C.green + "40", color: C.green, label: "In garage" },
    "in-service": { bg: C.blueBg, border: C.blue + "40", color: C.blue, label: "In service" },
    "pickup-scheduled": { bg: C.orangeDim, border: C.orange + "40", color: C.orange, label: "Ophaling" },
    paid: { bg: C.greenBg, border: C.green + "40", color: C.green, label: "Betaald" },
    pending: { bg: C.goldSubtle, border: C.gold + "40", color: C.gold, label: "In afwachting" },
    overdue: { bg: C.redBg, border: C.red + "40", color: C.red, label: "Achterstallig" },
    draft: { bg: C.purpleDim, border: C.purple + "40", color: C.purple, label: "Concept" },
    busy: { bg: C.orangeDim, border: C.orange + "40", color: C.orange, label: "Bezet" },
    available: { bg: C.greenBg, border: C.green + "40", color: C.green, label: "Beschikbaar" },
  };
  const s = map[status] || { bg: C.surface, border: C.panelBorder, color: C.textMuted, label: status };
  return <span style={{ fontSize: 10, fontFamily: mono, padding: "3px 10px", background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 2, letterSpacing: "0.06em", fontWeight: 500 }}>{s.label}</span>;
};

const TierBadge = ({ tier }) => {
  const map = { Platinum: C.white, Gold: C.gold, Silver: C.textMuted };
  return <span style={{ fontSize: 10, fontFamily: mono, padding: "3px 10px", background: "transparent", border: `1px solid ${map[tier] || C.textMuted}50`, color: map[tier] || C.textMuted, borderRadius: 2, letterSpacing: "0.1em" }}>{tier}</span>;
};

const PriorityDot = ({ p }) => {
  const col = p === "high" ? C.red : p === "normal" ? C.gold : C.textDark;
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: p === "high" ? `0 0 8px ${C.red}` : "none" }} />;
};

const Btn = ({ children, primary, small, onClick, style: sx }) => (
  <button onClick={onClick} style={{
    padding: small ? "6px 14px" : "10px 20px", fontSize: small ? 10 : 11,
    fontFamily: sans, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", borderRadius: 3,
    border: primary ? "none" : `1px solid ${C.panelBorder}`,
    background: primary ? C.gold : "transparent", color: primary ? C.bg : C.text,
    transition: "all 0.2s", ...sx,
  }}
    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
  >{children}</button>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative" }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textDark, fontSize: 14 }}>⌕</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Zoeken..."}
      style={{
        width: "100%", padding: "10px 14px 10px 36px", background: C.surface, border: `1px solid ${C.panelBorder}`,
        borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none",
        transition: "border-color 0.2s",
      }}
      onFocus={e => e.currentTarget.style.borderColor = C.goldDim}
      onBlur={e => e.currentTarget.style.borderColor = C.panelBorder}
    />
  </div>
);

const Hov = ({ children, style, onClick }) => {
  const [h, setH] = useState(false);
  return <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ transition: "all 0.2s", background: h ? C.surfaceHover : "transparent", cursor: onClick ? "pointer" : "default", borderRadius: 3, ...style }}>{children}</div>;
};

const Panel = ({ children, style }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 4, ...style }}>{children}</div>
);

const Modal = ({ open, onClose, title, width, children }) => {
  if (!open) return null;
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 6, width: "94%", maxWidth: width || 560, maxHeight: "85vh", overflow: "auto" }}>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.panel, zIndex: 1 }}>
        <span style={{ fontSize: 12, letterSpacing: "0.25em", color: C.gold, fontWeight: 500 }}>{title}</span>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textMuted, fontSize: 20, lineHeight: 1, padding: "4px 8px", borderRadius: 3, transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>×</span>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  </div>;
};

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return <div style={{ background: C.surface, border: `1px solid ${C.goldDim}`, padding: "8px 12px", fontFamily: mono, fontSize: 11, color: C.gold, borderRadius: 2 }}>
    <div style={{ color: C.textMuted, fontSize: 9, marginBottom: 2 }}>{payload[0].payload.m}</div>
    <div>€{payload[0].value.toLocaleString()}</div>
  </div>;
};

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function AdminDashboard() {
  const [sideOpen, setSideOpen] = useState(true);
  const [nav, setNav] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeClient, setComposeClient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [dashCarIdx, setDashCarIdx] = useState(0);
  const canvasRef = useRef(null);
  const cleanRef = useRef(null);

  // Supabase state
  const [dbBrands, setDbBrands] = useState([]);
  const [dbModels, setDbModels] = useState([]);
  const [settingsTab, setSettingsTab] = useState("brands");
  const [brandForm, setBrandForm] = useState({ name: "" });
  const [modelForm, setModelForm] = useState({ brand_id: "", name: "", year: "" });
  const [uploading, setUploading] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [vehicleLinks, setVehicleLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rau_vehicle_links") || "{}"); } catch { return {}; }
  });
  const [editVehicleId, setEditVehicleId] = useState(null);
  const [editVehicleBrand, setEditVehicleBrand] = useState("");
  const [editVehicleModel, setEditVehicleModel] = useState("");
  const [current3DUrl, setCurrent3DUrl] = useState(null);
  const [no3DModel, setNo3DModel] = useState(false);
  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbClients, setDbClients] = useState([]);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ client_id: "", model_id: "", plate: "", color: "", mileage: "", status: "garaged", next_service: "", value: "" });
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 200); }, []);

  // Load brands & models from Supabase
  const loadBrands = async () => {
    const { data } = await supabase.from("brands").select("*").order("name");
    if (data) setDbBrands(data);
  };
  const loadModels = async () => {
    const { data } = await supabase.from("models").select("*, brands(name)").order("name");
    if (data) setDbModels(data);
  };
  const loadVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*, clients(name, company), models(name, model_3d_path, brand_id, brands(name))").order("created_at", { ascending: false });
    if (data) setDbVehicles(data);
  };
  const loadClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("name");
    if (data) setDbClients(data);
  };
  const seedDemoClients = async () => {
    const demoClients = clients.map(c => ({ name: c.name, email: c.email, phone: c.phone, company: c.company, tier: c.tier, monthly_fee: c.monthlyFee, status: c.status }));
    const { error } = await supabase.from("clients").insert(demoClients);
    if (error) { flash("Fout bij importeren: " + error.message); return; }
    flash("Demo klanten geïmporteerd!");
    loadClients();
  };

  const seedDemoVehicles = async () => {
    // Ensure clients exist in DB first
    let currentClients = dbClients;
    if (currentClients.length === 0) {
      await seedDemoClients();
      const { data } = await supabase.from("clients").select("*");
      currentClients = data || [];
    }

    // Match mock clients to DB clients by name
    const vehiclesToInsert = [];
    for (const mockClient of clients) {
      const dbClient = currentClients.find(c => c.name === mockClient.name);
      if (!dbClient) continue;
      for (const v of mockClient.vehicles) {
        vehiclesToInsert.push({
          client_id: dbClient.id,
          plate: v.plate,
          color: v.color,
          mileage: v.mileage,
          status: v.status,
          next_service: v.nextService,
          value: v.value,
        });
      }
    }

    if (vehiclesToInsert.length === 0) { flash("Geen voertuigen om te importeren."); return; }

    const { error } = await supabase.from("vehicles").insert(vehiclesToInsert);
    if (error) { flash("Fout: " + error.message); return; }
    flash(`${vehiclesToInsert.length} demo voertuigen geïmporteerd!`);
    loadVehicles();
    loadClients();
  };
  useEffect(() => { loadBrands(); loadModels(); loadVehicles(); loadClients(); }, []);

  // Flash message helper
  const flash = (msg) => { setSettingsMsg(msg); setTimeout(() => setSettingsMsg(null), 3000); };

  // ── BRAND CRUD ──
  const addBrand = async () => {
    if (!brandForm.name.trim()) return;
    const { error } = await supabase.from("brands").insert({ name: brandForm.name.trim() });
    if (error) { flash("Fout: " + error.message); return; }
    setBrandForm({ name: "" });
    flash("Merk toegevoegd!");
    loadBrands();
  };
  const updateBrand = async () => {
    if (!editingBrand || !brandForm.name.trim()) return;
    await supabase.from("brands").update({ name: brandForm.name.trim() }).eq("id", editingBrand);
    setEditingBrand(null);
    setBrandForm({ name: "" });
    flash("Merk bijgewerkt!");
    loadBrands();
    loadModels();
  };
  const deleteBrand = async (id) => {
    if (!confirm("Dit verwijdert ook alle modellen van dit merk. Doorgaan?")) return;
    await supabase.from("brands").delete().eq("id", id);
    flash("Merk verwijderd!");
    loadBrands();
    loadModels();
  };

  // ── MODEL CRUD ──
  const addModel = async () => {
    if (!modelForm.name.trim() || !modelForm.brand_id) return;
    const { error } = await supabase.from("models").insert({
      name: modelForm.name.trim(),
      brand_id: modelForm.brand_id,
      year: modelForm.year ? parseInt(modelForm.year) : null,
    });
    if (error) { flash("Fout: " + error.message); return; }
    setModelForm({ brand_id: "", name: "", year: "" });
    flash("Model toegevoegd!");
    loadModels();
  };
  const deleteModel = async (id) => {
    if (!confirm("Model verwijderen?")) return;
    // Also delete 3D file if exists
    const model = dbModels.find(m => m.id === id);
    if (model?.model_3d_path) {
      await supabase.storage.from("3d-models").remove([model.model_3d_path]);
    }
    await supabase.from("models").delete().eq("id", id);
    flash("Model verwijderd!");
    loadModels();
  };

  // ── 3D FILE UPLOAD ──
  const upload3DModel = async (modelId, file) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${modelId}.${ext}`;

    // Remove old file if exists
    const model = dbModels.find(m => m.id === modelId);
    if (model?.model_3d_path) {
      await supabase.storage.from("3d-models").remove([model.model_3d_path]);
    }

    const { error: uploadError } = await supabase.storage.from("3d-models").upload(filePath, file, { upsert: true });
    if (uploadError) { flash("Upload fout: " + uploadError.message); setUploading(false); return; }

    await supabase.from("models").update({ model_3d_path: filePath }).eq("id", modelId);
    flash("3D model geüpload!");
    setUploading(false);
    loadModels();
  };

  // ── VEHICLE CRUD ──
  const resetVehicleForm = () => setVehicleForm({ client_id: "", model_id: "", plate: "", color: "", mileage: "", status: "garaged", next_service: "", value: "" });

  const addVehicle = async () => {
    const f = vehicleForm;
    if (!f.client_id || !f.plate.trim()) { flash("Klant en nummerplaat zijn verplicht."); return; }
    const { error } = await supabase.from("vehicles").insert({
      client_id: f.client_id,
      model_id: f.model_id || null,
      plate: f.plate.trim(),
      color: f.color.trim(),
      mileage: f.mileage.trim() || "0 km",
      status: f.status,
      next_service: f.next_service || null,
      value: f.value ? parseInt(f.value) : 0,
    });
    if (error) { flash("Fout: " + error.message); return; }
    flash("Voertuig aangemaakt!");
    resetVehicleForm();
    setNewVehicleOpen(false);
    loadVehicles();
  };

  const updateVehicle = async () => {
    if (!editingVehicleId) return;
    const f = vehicleForm;
    const { error } = await supabase.from("vehicles").update({
      client_id: f.client_id || undefined,
      model_id: f.model_id || null,
      plate: f.plate.trim(),
      color: f.color.trim(),
      mileage: f.mileage.trim(),
      status: f.status,
      next_service: f.next_service || null,
      value: f.value ? parseInt(f.value) : 0,
    }).eq("id", editingVehicleId);
    if (error) { flash("Fout: " + error.message); return; }
    flash("Voertuig bijgewerkt!");
    resetVehicleForm();
    setEditingVehicleId(null);
    setNewVehicleOpen(false);
    loadVehicles();
  };

  const deleteVehicle = async (id) => {
    if (!confirm("Voertuig verwijderen? Dit kan niet ongedaan worden.")) return;
    await supabase.from("vehicles").delete().eq("id", id);
    flash("Voertuig verwijderd!");
    loadVehicles();
  };

  // ── VEHICLE ↔ MODEL LINKING ──
  const saveVehicleLink = async (vehicleId, modelId) => {
    // For DB vehicles: update model_id directly
    const dbV = dbVehicles.find(v => v.id === vehicleId);
    if (dbV) {
      await supabase.from("vehicles").update({ model_id: modelId }).eq("id", vehicleId);
      loadVehicles();
    }
    // For mock vehicles: use localStorage
    const newLinks = { ...vehicleLinks, [vehicleId]: modelId };
    setVehicleLinks(newLinks);
    localStorage.setItem("rau_vehicle_links", JSON.stringify(newLinks));
  };
  const removeVehicleLink = async (vehicleId) => {
    const dbV = dbVehicles.find(v => v.id === vehicleId);
    if (dbV) {
      await supabase.from("vehicles").update({ model_id: null }).eq("id", vehicleId);
      loadVehicles();
    }
    const newLinks = { ...vehicleLinks };
    delete newLinks[vehicleId];
    setVehicleLinks(newLinks);
    localStorage.setItem("rau_vehicle_links", JSON.stringify(newLinks));
  };
  const getLinkedModel = (vehicleId) => {
    // Check DB vehicle's model_id first
    const dbV = dbVehicles.find(v => v.id === vehicleId);
    if (dbV?.model_id) return dbModels.find(m => m.id === dbV.model_id) || null;
    // Fallback to localStorage link for mock vehicles
    const modelId = vehicleLinks[vehicleId];
    if (!modelId) return null;
    return dbModels.find(m => m.id === modelId) || null;
  };
  const getLinkedBrand = (modelObj) => {
    if (!modelObj) return null;
    return dbBrands.find(b => b.id === modelObj.brand_id) || null;
  };
  const get3DUrl = (vehicleId) => {
    const model = getLinkedModel(vehicleId);
    if (!model?.model_3d_path) return null;
    return supabase.storage.from("3d-models").getPublicUrl(model.model_3d_path).data.publicUrl;
  };

  // Combine mock vehicles + DB vehicles (hide mock when DB has vehicles)
  const mockVehicles = clients.flatMap(c => c.vehicles.map(v => ({ ...v, clientName: c.name, clientId: c.id, source: "mock" })));
  const realVehicles = dbVehicles.map(v => {
    const client = v.clients;
    const model = v.models;
    const brand = model?.brands;
    return {
      id: v.id, name: model?.name || "Onbekend model", make: brand?.name || "Onbekend",
      year: model?.year || null, plate: v.plate, color: v.color, mileage: v.mileage || "0 km",
      status: v.status, nextService: v.next_service, value: v.value || 0,
      clientName: client?.name || "Onbekend", clientId: v.client_id, source: "db",
      model_id: v.model_id,
    };
  });
  const showMock = realVehicles.length === 0;
  const allVehicles = showMock ? [...mockVehicles] : [...realVehicles];

  // ── 3D SCENE — loads per selected vehicle ──
  useEffect(() => {
    if (!canvasRef.current || nav !== "dashboard") return;
    if (cleanRef.current) cleanRef.current();

    const vehicle = allVehicles[dashCarIdx % allVehicles.length];
    const modelUrl = vehicle ? get3DUrl(vehicle.id) : null;

    if (modelUrl) {
      setNo3DModel(false);
      setCurrent3DUrl(modelUrl);
      cleanRef.current = buildCar(canvasRef.current, modelUrl);
    } else {
      setNo3DModel(true);
      setCurrent3DUrl(null);
      // Still render empty studio
      cleanRef.current = buildCar(canvasRef.current, null);
    }
    return () => { if (cleanRef.current) cleanRef.current(); };
  }, [nav, dashCarIdx, vehicleLinks, dbModels]);
  const activeClients = clients.filter(c => c.status === "active").length;
  const monthlyRevenue = clients.filter(c => c.status === "active").reduce((s, c) => s + c.monthlyFee, 0);
  const pendingServices = services.filter(s => s.status !== "completed").length;
  const unreadMessages = messages.filter(m => !m.read).length;
  const sw = sideOpen ? 220 : 58;

  const getVehicle = (vid) => allVehicles.find(v => v.id === vid);
  const getClient = (cid) => clients.find(c => c.id === cid);

  /* ═══ DASHBOARD ═══ */
  const dashVehicle = allVehicles[dashCarIdx % allVehicles.length];
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ─── 3D HERO ─── */}
      <div style={{ flex: "1 1 50%", position: "relative", minHeight: 320 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* No 3D model placeholder */}
        {no3DModel && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 8, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12, pointerEvents: "none",
          }}>
            <div style={{ fontSize: 48, opacity: 0.15 }}>⬡</div>
            <div style={{ fontSize: 14, color: C.textMuted, letterSpacing: "0.15em" }}>GEEN 3D MODEL</div>
            <div style={{ fontSize: 11, color: C.textDark, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
              Koppel dit voertuig aan een model in de Fleet-pagina, of upload een 3D bestand in Instellingen.
            </div>
          </div>
        )}

        {/* Top-left: greeting */}
        <div style={{ position: "absolute", top: 24, left: 28, zIndex: 10 }}>
          <div style={{ fontSize: 20, color: C.white, fontWeight: 300 }}>Goedemorgen, Anton</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Dinsdag 25 maart 2026 — {allVehicles.length} wagens in beheer</div>
        </div>

        {/* Top-right: action */}
        <div style={{ position: "absolute", top: 24, right: 28, zIndex: 10 }}>
          <Btn primary onClick={() => setNewServiceOpen(true)}>+ NIEUWE SERVICE</Btn>
        </div>

        {/* Center vehicle info */}
        <div style={{ position: "absolute", bottom: 80, left: 28, zIndex: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.4em", color: C.textMuted, marginBottom: 6 }}>IN FOCUS</div>
          <div style={{ fontSize: 28, fontWeight: 200, letterSpacing: "0.06em", color: C.white }}>{dashVehicle?.make} {dashVehicle?.name}</div>
          <div style={{ fontSize: 12, color: C.gold, letterSpacing: "0.15em", marginTop: 4 }}>
            {dashVehicle?.plate} · {dashVehicle?.color} · {dashVehicle?.mileage}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Eigenaar: {dashVehicle?.clientName}</div>
          {dashVehicle && getLinkedModel(dashVehicle.id) && (
            <div style={{ fontSize: 10, color: C.gold, fontFamily: mono, marginTop: 4, opacity: 0.7 }}>
              {getLinkedBrand(getLinkedModel(dashVehicle.id))?.name} {getLinkedModel(dashVehicle.id)?.name}
            </div>
          )}
        </div>

        {/* Center-right value + status */}
        <div style={{ position: "absolute", bottom: 80, right: 28, zIndex: 10, textAlign: "right" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.textMuted }}>WAARDE</div>
          <div style={{ fontSize: 30, fontWeight: 300, color: C.goldBright, fontFamily: mono, marginTop: 4 }}>{fmtEuro(dashVehicle?.value || 0)}</div>
          <div style={{ marginTop: 8 }}><StatusBadge status={dashVehicle?.status || "garaged"} /></div>
        </div>

        {/* Vehicle selector */}
        <div style={{ position: "absolute", bottom: 20, left: 28, right: 28, zIndex: 10, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {allVehicles.map((v, i) => {
            const sel = i === dashCarIdx % allVehicles.length;
            return (
              <div key={v.id} onClick={() => setDashCarIdx(i)} style={{
                padding: "8px 16px", flexShrink: 0,
                background: sel ? C.surface : "rgba(8,8,8,0.8)",
                border: `1px solid ${sel ? C.gold : C.panelBorder}`,
                borderRadius: 3, cursor: "pointer", transition: "all 0.3s",
                backdropFilter: "blur(12px)",
              }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = C.goldDim; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = C.panelBorder; }}
              >
                <div style={{ fontSize: 10, color: sel ? C.gold : C.text, fontWeight: 500, letterSpacing: "0.08em" }}>{v.make}</div>
                <div style={{ fontSize: 9, color: C.textMuted, fontFamily: mono, marginTop: 1 }}>{v.name}</div>
              </div>
            );
          })}
        </div>

        {/* Bottom gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: `linear-gradient(transparent, ${C.bg})`, pointerEvents: "none", zIndex: 5 }} />
      </div>

      {/* ─── GOLD DIVIDER ─── */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.5, flexShrink: 0 }} />

      {/* ─── BOTTOM PANELS ─── */}
      <div style={{ flex: "0 0 auto", overflowY: "auto", padding: 20 }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "ACTIEVE KLANTEN", value: activeClients, sub: `${clients.length} totaal`, color: C.green, icon: "◇" },
            { label: "WAGENS IN BEHEER", value: allVehicles.length, sub: `${allVehicles.filter(v => v.status === "in-service").length} in service`, color: C.blue, icon: "⬡" },
            { label: "MAANDOMZET", value: fmtEuro(monthlyRevenue), sub: "+12% vs vorige maand", color: C.gold, icon: "□" },
            { label: "OPEN SERVICES", value: pendingServices, sub: `${services.filter(s => s.status === "in-progress").length} in uitvoering`, color: C.orange, icon: "○" },
          ].map((kpi, i) => (
            <Panel key={i} style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.25em", color: C.textMuted }}>{kpi.label}</div>
                <span style={{ fontSize: 14, color: kpi.color, opacity: 0.4 }}>{kpi.icon}</span>
              </div>
              <div style={{ fontSize: 26, color: kpi.color, fontFamily: mono, fontWeight: 400, marginTop: 8 }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: C.textDark, marginTop: 4 }}>{kpi.sub}</div>
            </Panel>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12 }}>
          {/* Revenue chart */}
          <Panel style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.25em", color: C.text, fontWeight: 500, marginBottom: 14 }}>OMZET 6 MAANDEN</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.25} /><stop offset="100%" stopColor={C.gold} stopOpacity={0.02} /></linearGradient></defs>
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: C.textMuted, fontFamily: mono }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: C.textMuted, fontFamily: mono }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Today's schedule */}
          <Panel style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.25em", color: C.text, fontWeight: 500, marginBottom: 14 }}>VANDAAG</div>
            {services.filter(s => s.date === "2026-03-25" || s.status === "in-progress").slice(0, 3).map(s => {
              const v = getVehicle(s.vehicleId);
              return (
                <Hov key={s.id} onClick={() => setSelectedService(s)} style={{ padding: "10px 12px", marginBottom: 4, borderBottom: `1px solid ${C.panelBorder}15` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.text }}>{s.type}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{v?.make} {v?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <PriorityDot p={s.priority} />
                    <span style={{ fontSize: 9, color: C.textDark, fontFamily: mono }}>{s.tech}</span>
                  </div>
                </Hov>
              );
            })}
          </Panel>

          {/* Alerts column */}
          <Panel style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.25em", color: C.text, fontWeight: 500 }}>ALERTS</div>
              {unreadMessages > 0 && <span style={{ fontSize: 10, fontFamily: mono, padding: "2px 8px", background: C.redBg, color: C.red, borderRadius: 10 }}>{unreadMessages}</span>}
            </div>
            {messages.filter(m => !m.read).map(m => (
              <Hov key={m.id} onClick={() => setNav("messages")} style={{ padding: "8px 10px", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{m.subject}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textDark, marginTop: 3, marginLeft: 12 }}>{m.clientName} · {m.time}</div>
              </Hov>
            ))}
            {invoices.filter(inv => inv.status === "overdue").map(inv => (
              <Hov key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ padding: "8px 10px", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.text }}>Achterstallig: {inv.clientName}</span>
                </div>
                <div style={{ fontSize: 10, color: C.red, fontFamily: mono, marginTop: 3, marginLeft: 12 }}>€{inv.amount.toLocaleString()}</div>
              </Hov>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );

  /* ═══ CLIENTS ═══ */
  const renderClients = () => (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>KLANTEN ({clients.length})</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 260 }}><SearchBar value={search} onChange={setSearch} placeholder="Zoek klant..." /></div>
          <Btn primary small>+ NIEUWE KLANT</Btn>
        </div>
      </div>
      <Panel style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
          <span>KLANT</span><span>TIER</span><span>WAGENS</span><span>MAANDBEDRAG</span><span>TOTAAL BESTEED</span><span>STATUS</span>
        </div>
        {clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())).map(c => (
          <Hov key={c.id} onClick={() => setSelectedClient(c)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.goldSubtle, border: `1px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 600, fontFamily: mono, flexShrink: 0 }}>{c.avatar}</div>
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 400 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: C.textDark, marginTop: 1 }}>{c.company}</div>
              </div>
            </div>
            <TierBadge tier={c.tier} />
            <span style={{ fontSize: 13, color: C.text, fontFamily: mono }}>{c.vehicles.length}</span>
            <span style={{ fontSize: 13, color: C.gold, fontFamily: mono }}>€{c.monthlyFee.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: mono }}>{fmtEuro(c.totalSpent)}</span>
            <StatusBadge status={c.status} />
          </Hov>
        ))}
      </Panel>
    </div>
  );

  /* ═══ FLEET ═══ */
  const renderFleet = () => (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      {/* Flash message */}
      {settingsMsg && (
        <div style={{ padding: "12px 18px", background: C.greenBg, border: `1px solid ${C.green}40`, borderRadius: 4, marginBottom: 16, fontSize: 12, color: C.green }}>
          {settingsMsg}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>FLEET ({allVehicles.length} WAGENS)</div>
          {realVehicles.length > 0 && <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, marginTop: 3 }}>{realVehicles.length} in database · {mockVehicles.length} demo</div>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 220 }}><SearchBar value={search} onChange={setSearch} placeholder="Zoek wagen..." /></div>
          {showMock && <Btn onClick={seedDemoVehicles}>DEMO IMPORTEREN</Btn>}
          <Btn primary onClick={() => { resetVehicleForm(); setEditingVehicleId(null); setNewVehicleOpen(true); }}>+ NIEUW VOERTUIG</Btn>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {allVehicles.filter(v => !search || `${v.make} ${v.name} ${v.plate} ${v.clientName}`.toLowerCase().includes(search.toLowerCase())).map(v => {
          const linkedModel = getLinkedModel(v.id);
          const linkedBrand = getLinkedBrand(linkedModel);
          const has3D = !!linkedModel?.model_3d_path;
          const isDb = v.source === "db";
          return (
          <Panel key={v.id + v.source} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${v.status === "in-service" ? C.blue : v.status === "pickup-scheduled" ? C.orange : C.green}, ${C.gold})` }} />
            <div style={{ padding: "18px 20px" }}>
              {/* Source badge */}
              {!isDb && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 8, fontFamily: mono, padding: "2px 8px", background: C.surface, color: C.textDark, borderRadius: 2, letterSpacing: "0.1em" }}>DEMO</span></div>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted }}>{v.make.toUpperCase()}</div>
                  <div style={{ fontSize: 18, color: C.white, fontWeight: 300, marginTop: 3 }}>{v.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusBadge status={v.status} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ l: "EIGENAAR", v: v.clientName }, { l: "NUMMERPLAAT", v: v.plate }, { l: "KILOMETERSTAND", v: v.mileage }, { l: "KLEUR", v: v.color || "—" }].map((d, i) => (
                  <div key={i}><div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div><div style={{ fontSize: 11, color: C.text, fontFamily: mono, marginTop: 2 }}>{d.v}</div></div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.panelBorder}20`, marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: C.textDark, fontFamily: mono }}>Volgende service: {v.nextService || "—"}</span>
                <span style={{ fontSize: 14, color: C.goldBright, fontFamily: mono, fontWeight: 500 }}>{fmtEuro(v.value)}</span>
              </div>

              {/* Linked model info */}
              <div style={{
                padding: "10px 14px", borderRadius: 4, marginBottom: 10,
                background: linkedModel ? (has3D ? C.greenBg : C.goldSubtle) : C.surface,
                border: `1px solid ${linkedModel ? (has3D ? C.green + "30" : C.gold + "30") : C.panelBorder}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: linkedModel ? (has3D ? C.green : C.gold) : C.textDark }} />
                  <span style={{ fontSize: 10, color: linkedModel ? (has3D ? C.green : C.gold) : C.textMuted, fontWeight: 500 }}>
                    {linkedModel
                      ? (has3D ? `${linkedBrand?.name} ${linkedModel.name} — 3D MODEL ACTIEF` : `${linkedBrand?.name} ${linkedModel.name} — GEEN 3D BESTAND`)
                      : "NIET GEKOPPELD AAN MODEL"
                    }
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Btn small style={{ flex: 1 }} onClick={() => {
                  setEditVehicleId(v.id);
                  const lm = linkedModel;
                  if (lm) { setEditVehicleBrand(lm.brand_id); setEditVehicleModel(lm.id); }
                  else { setEditVehicleBrand(""); setEditVehicleModel(""); }
                }}>
                  {linkedModel ? "MODEL WIJZIGEN" : "KOPPEL MODEL"}
                </Btn>
                {linkedModel && (
                  <Btn small onClick={() => removeVehicleLink(v.id)} style={{ borderColor: C.red + "40", color: C.red }}>✕</Btn>
                )}
                {isDb && (
                  <>
                    <Btn small onClick={() => {
                      setEditingVehicleId(v.id);
                      const dbV = dbVehicles.find(dv => dv.id === v.id);
                      setVehicleForm({
                        client_id: dbV?.client_id || "",
                        model_id: dbV?.model_id || "",
                        plate: v.plate || "",
                        color: v.color || "",
                        mileage: v.mileage || "",
                        status: v.status || "garaged",
                        next_service: v.nextService || "",
                        value: v.value ? String(v.value) : "",
                      });
                      setNewVehicleOpen(true);
                    }} style={{ borderColor: C.gold + "40", color: C.gold }}>✎</Btn>
                    <Btn small onClick={() => deleteVehicle(v.id)} style={{ borderColor: C.red + "40", color: C.red }}>🗑</Btn>
                  </>
                )}
              </div>
            </div>
          </Panel>
          );
        })}
      </div>
    </div>
  );

  /* ═══ SERVICES ═══ */
  const renderServices = () => {
    const filtered = services.filter(s => serviceFilter === "all" || s.status === serviceFilter);
    return (
      <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>SERVICE PLANNING</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["all", "in-progress", "scheduled", "completed"].map(f => (
              <div key={f} onClick={() => setServiceFilter(f)} style={{
                padding: "5px 12px", fontSize: 10, fontFamily: mono, cursor: "pointer", borderRadius: 2,
                border: `1px solid ${serviceFilter === f ? C.gold : C.panelBorder}`,
                color: serviceFilter === f ? C.gold : C.textMuted,
                background: serviceFilter === f ? C.goldSubtle : "transparent", transition: "all 0.2s",
              }}>{f === "all" ? "ALLE" : f === "in-progress" ? "ACTIEF" : f === "scheduled" ? "GEPLAND" : "VOLTOOID"}</div>
            ))}
            <Btn primary small onClick={() => setNewServiceOpen(true)}>+ NIEUWE SERVICE</Btn>
          </div>
        </div>
        <Panel style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.3fr 1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
            <span></span><span>SERVICE</span><span>WAGEN</span><span>KLANT</span><span>TECHNICUS</span><span>KOST</span><span>STATUS</span>
          </div>
          {filtered.map(s => {
            const v = getVehicle(s.vehicleId);
            const cl = getClient(s.clientId);
            return (
              <Hov key={s.id} onClick={() => setSelectedService(s)} style={{ display: "grid", gridTemplateColumns: "0.3fr 1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
                <PriorityDot p={s.priority} />
                <div><div style={{ fontSize: 12, color: C.text }}>{s.type}</div><div style={{ fontSize: 10, color: C.textDark, marginTop: 2 }}>{s.date}</div></div>
                <div style={{ fontSize: 12, color: C.text }}>{v?.make} {v?.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{cl?.name?.split(" ").slice(0, 2).join(" ")}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: mono }}>{s.tech}</div>
                <div style={{ fontSize: 12, color: C.gold, fontFamily: mono }}>€{s.estimatedCost.toLocaleString()}</div>
                <StatusBadge status={s.status} />
              </Hov>
            );
          })}
        </Panel>
      </div>
    );
  };

  /* ═══ INVOICES ═══ */
  const renderInvoices = () => {
    const filtered = invoices.filter(inv => invoiceFilter === "all" || inv.status === invoiceFilter);
    const totalPending = invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    return (
      <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>FACTURATIE</div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: mono, marginTop: 3 }}>Openstaand: €{totalPending.toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["all", "paid", "pending", "overdue", "draft"].map(f => (
              <div key={f} onClick={() => setInvoiceFilter(f)} style={{
                padding: "5px 12px", fontSize: 10, fontFamily: mono, cursor: "pointer", borderRadius: 2,
                border: `1px solid ${invoiceFilter === f ? C.gold : C.panelBorder}`,
                color: invoiceFilter === f ? C.gold : C.textMuted,
                background: invoiceFilter === f ? C.goldSubtle : "transparent", transition: "all 0.2s",
              }}>{f === "all" ? "ALLE" : f === "paid" ? "BETAALD" : f === "pending" ? "OPEN" : f === "overdue" ? "ACHTERSTALLIG" : "CONCEPT"}</div>
            ))}
            <Btn primary small>+ NIEUWE FACTUUR</Btn>
          </div>
        </div>
        <Panel style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.5fr 1fr 1fr 1fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
            <span>NR</span><span>KLANT</span><span>TYPE</span><span>PERIODE</span><span>BEDRAG</span><span>STATUS</span>
          </div>
          {filtered.map(inv => (
            <Hov key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ display: "grid", gridTemplateColumns: "0.8fr 1.5fr 1fr 1fr 1fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.textDark, fontFamily: mono }}>{inv.id.toUpperCase()}</span>
              <span style={{ fontSize: 12, color: C.text }}>{inv.clientName}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>{inv.type}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: mono }}>{inv.period || inv.date}</span>
              <span style={{ fontSize: 13, color: C.gold, fontFamily: mono, fontWeight: 500 }}>€{inv.amount.toLocaleString()}</span>
              <StatusBadge status={inv.status} />
            </Hov>
          ))}
        </Panel>
      </div>
    );
  };

  /* ═══ MESSAGES ═══ */
  const renderMessages = () => (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>BERICHTEN</div>
        <Btn primary small onClick={() => setComposeOpen(true)}>+ NIEUW BERICHT</Btn>
      </div>
      <Panel style={{ overflow: "hidden" }}>
        {messages.map(m => (
          <Hov key={m.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.panelBorder}15` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ marginTop: 2 }}>
                {!m.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />}
                {m.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "transparent" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: m.read ? C.textMuted : C.white, fontWeight: m.read ? 300 : 500 }}>{m.subject}</span>
                    <span style={{ fontSize: 9, color: m.direction === "outgoing" ? C.blue : C.green, fontFamily: mono, padding: "1px 6px", background: m.direction === "outgoing" ? C.blueBg : C.greenBg, borderRadius: 2 }}>
                      {m.direction === "outgoing" ? "VERZONDEN" : "ONTVANGEN"}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: C.textDark, fontFamily: mono }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 11, color: C.textDark, marginTop: 4 }}>{m.clientName}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{m.preview}</div>
              </div>
            </div>
          </Hov>
        ))}
      </Panel>
    </div>
  );

  /* ═══ TEAM ═══ */
  const renderTeam = () => (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500, marginBottom: 20 }}>TEAM ({team.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {team.map(t => (
          <Panel key={t.id} style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.goldSubtle, border: `2px solid ${t.status === "available" ? C.green : C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.gold, fontWeight: 600, fontFamily: mono }}>{t.avatar}</div>
              <div>
                <div style={{ fontSize: 15, color: C.white, fontWeight: 400 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{t.role}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div><div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>SPECIALISATIE</div><div style={{ fontSize: 11, color: C.text, marginTop: 2 }}>{t.speciality}</div></div>
              <StatusBadge status={t.status} />
            </div>
            <div style={{ padding: "10px 0", borderTop: `1px solid ${C.panelBorder}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textDark }}>Actieve taken</span>
              <span style={{ fontSize: 16, color: t.active > 0 ? C.gold : C.green, fontFamily: mono, fontWeight: 500 }}>{t.active}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn small style={{ flex: 1 }}>PLANNING</Btn>
              <Btn small style={{ flex: 1 }}>PROFIEL</Btn>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );

  const sections = { dashboard: renderDashboard, clients: renderClients, fleet: renderFleet, services: renderServices, invoices: renderInvoices, messages: renderMessages, team: renderTeam, settings: renderSettings };

  /* ═══ SETTINGS — Brand & Model Management ═══ */
  function renderSettings() {
    const inputStyle = { width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" };
    const selectStyle = { ...inputStyle };

    return (
      <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500, marginBottom: 20 }}>INSTELLINGEN</div>

        {/* Flash message */}
        {settingsMsg && (
          <div style={{ padding: "12px 18px", background: C.greenBg, border: `1px solid ${C.green}40`, borderRadius: 4, marginBottom: 16, fontSize: 12, color: C.green }}>
            {settingsMsg}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[{ id: "brands", label: "MERKEN" }, { id: "models", label: "MODELLEN" }].map(tab => (
            <div key={tab.id} onClick={() => setSettingsTab(tab.id)} style={{
              padding: "8px 20px", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", borderRadius: 3,
              border: `1px solid ${settingsTab === tab.id ? C.gold : C.panelBorder}`,
              color: settingsTab === tab.id ? C.gold : C.textMuted,
              background: settingsTab === tab.id ? C.goldSubtle : "transparent",
              fontFamily: mono, transition: "all 0.2s",
            }}>{tab.label}</div>
          ))}
        </div>

        {/* ── BRANDS TAB ── */}
        {settingsTab === "brands" && (
          <div>
            {/* Add / Edit brand form */}
            <Panel style={{ padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted, marginBottom: 12 }}>
                {editingBrand ? "MERK BEWERKEN" : "NIEUW MERK TOEVOEGEN"}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={brandForm.name}
                  onChange={e => setBrandForm({ name: e.target.value })}
                  placeholder="Merknaam (bijv. Ferrari, Lamborghini...)"
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => { if (e.key === "Enter") editingBrand ? updateBrand() : addBrand(); }}
                />
                {editingBrand ? (
                  <>
                    <Btn primary onClick={updateBrand}>OPSLAAN</Btn>
                    <Btn onClick={() => { setEditingBrand(null); setBrandForm({ name: "" }); }}>ANNULEREN</Btn>
                  </>
                ) : (
                  <Btn primary onClick={addBrand}>TOEVOEGEN</Btn>
                )}
              </div>
            </Panel>

            {/* Brands list */}
            <Panel style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
                <span>MERK</span><span>MODELLEN</span><span>AANGEMAAKT</span><span>ACTIES</span>
              </div>
              {dbBrands.length === 0 && (
                <div style={{ padding: "24px 20px", color: C.textDark, fontSize: 12, textAlign: "center" }}>
                  Nog geen merken toegevoegd. Voeg hierboven je eerste merk toe.
                </div>
              )}
              {dbBrands.map(b => {
                const modelCount = dbModels.filter(m => m.brand_id === b.id).length;
                return (
                  <Hov key={b.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: C.goldSubtle, border: `1px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.gold, fontWeight: 600 }}>
                        {b.name.charAt(0)}
                      </div>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 400 }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.textMuted, fontFamily: mono }}>{modelCount}</span>
                    <span style={{ fontSize: 10, color: C.textDark, fontFamily: mono }}>{new Date(b.created_at).toLocaleDateString("nl-BE")}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn small onClick={() => { setEditingBrand(b.id); setBrandForm({ name: b.name }); }}>✎</Btn>
                      <Btn small onClick={() => deleteBrand(b.id)} style={{ borderColor: C.red + "40", color: C.red }}>✕</Btn>
                    </div>
                  </Hov>
                );
              })}
            </Panel>
          </div>
        )}

        {/* ── MODELS TAB ── */}
        {settingsTab === "models" && (
          <div>
            {/* Add model form */}
            <Panel style={{ padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted, marginBottom: 12 }}>NIEUW MODEL TOEVOEGEN</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  value={modelForm.brand_id}
                  onChange={e => setModelForm({ ...modelForm, brand_id: e.target.value })}
                  style={{ ...selectStyle, flex: "1 1 200px" }}
                >
                  <option value="">Selecteer merk...</option>
                  {dbBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input
                  value={modelForm.name}
                  onChange={e => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="Modelnaam (bijv. Purosangue)"
                  style={{ ...inputStyle, flex: "1 1 200px" }}
                />
                <input
                  value={modelForm.year}
                  onChange={e => setModelForm({ ...modelForm, year: e.target.value })}
                  placeholder="Jaar"
                  type="number"
                  style={{ ...inputStyle, flex: "0 0 100px" }}
                />
                <Btn primary onClick={addModel}>TOEVOEGEN</Btn>
              </div>
              {dbBrands.length === 0 && (
                <div style={{ fontSize: 11, color: C.orange, marginTop: 10 }}>
                  ⚠ Voeg eerst een merk toe in het "Merken" tabblad.
                </div>
              )}
            </Panel>

            {/* Models list grouped by brand */}
            {dbBrands.map(brand => {
              const brandModels = dbModels.filter(m => m.brand_id === brand.id);
              if (brandModels.length === 0) return null;
              return (
                <div key={brand.id} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", color: C.gold, fontWeight: 500, marginBottom: 10 }}>
                    {brand.name.toUpperCase()}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                    {brandModels.map(model => {
                      const has3D = !!model.model_3d_path;
                      const publicUrl = has3D
                        ? supabase.storage.from("3d-models").getPublicUrl(model.model_3d_path).data.publicUrl
                        : null;
                      return (
                        <Panel key={model.id} style={{ padding: 0, overflow: "hidden" }}>
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${has3D ? C.green : C.panelBorder})` }} />
                          <div style={{ padding: "18px 20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                              <div>
                                <div style={{ fontSize: 16, color: C.white, fontWeight: 400 }}>{model.name}</div>
                                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: mono, marginTop: 3 }}>
                                  {brand.name} · {model.year || "—"}
                                </div>
                              </div>
                              <Btn small onClick={() => deleteModel(model.id)} style={{ borderColor: C.red + "40", color: C.red }}>✕</Btn>
                            </div>

                            {/* 3D model status */}
                            <div style={{
                              padding: "14px 16px", borderRadius: 4, marginBottom: 12,
                              background: has3D ? C.greenBg : C.surface,
                              border: `1px solid ${has3D ? C.green + "30" : C.panelBorder}`,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: has3D ? C.green : C.textDark }} />
                                <span style={{ fontSize: 11, color: has3D ? C.green : C.textMuted, fontWeight: 500 }}>
                                  {has3D ? "3D MODEL GEÜPLOAD" : "GEEN 3D MODEL"}
                                </span>
                              </div>
                              {has3D && (
                                <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, wordBreak: "break-all" }}>
                                  {model.model_3d_path}
                                </div>
                              )}
                            </div>

                            {/* Upload button */}
                            <label style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              padding: "10px 16px", borderRadius: 3, cursor: uploading ? "wait" : "pointer",
                              border: `1px solid ${C.gold}`, color: C.gold, background: C.goldSubtle,
                              fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", fontFamily: sans,
                              transition: "all 0.2s", opacity: uploading ? 0.5 : 1,
                            }}>
                              {uploading ? "UPLOADEN..." : has3D ? "3D MODEL VERVANGEN" : "3D MODEL UPLOADEN (.glb)"}
                              <input
                                type="file"
                                accept=".glb,.gltf"
                                style={{ display: "none" }}
                                disabled={uploading}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) upload3DModel(model.id, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </Panel>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Models without brand match (shouldn't happen but just in case) */}
            {dbModels.length === 0 && (
              <Panel style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.textDark }}>Nog geen modellen. Voeg hierboven een model toe.</div>
              </Panel>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, color: C.white, fontFamily: sans, overflow: "hidden", position: "relative", letterSpacing: "0.03em" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@200;300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.goldDim};border-radius:2px}
        *{scrollbar-width:thin;scrollbar-color:${C.goldDim} transparent}
        input::placeholder{color:${C.textDark}}
        textarea::placeholder{color:${C.textDark}}
        textarea{resize:vertical}
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.4) 100%)" }} />

      {/* Sidebar */}
      <nav style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: sw, zIndex: 100, background: C.panel, borderRight: `1px solid ${C.panelBorder}`, transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", opacity: loaded ? 1 : 0 }}>
        <div onClick={() => setSideOpen(!sideOpen)} style={{ padding: sideOpen ? "22px 20px" : "22px 14px", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "padding 0.35s" }}>
          <div style={{ width: 30, height: 30, border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 13, color: C.gold, fontWeight: 600, flexShrink: 0 }}>R</div>
          {sideOpen && <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.22em", color: C.white }}>RAÚ</div>
            <div style={{ fontSize: 7, letterSpacing: "0.35em", color: C.textMuted }}>ADMIN CONSOLE</div>
          </div>}
        </div>

        <div style={{ flex: 1, padding: "10px 0", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {navItems.map(it => {
            const a = nav === it.id;
            const hasNotif = it.id === "messages" && unreadMessages > 0;
            return (
              <div key={it.id} onClick={() => { setNav(it.id); setSearch(""); }} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: sideOpen ? "10px 20px" : "10px 18px",
                color: a ? C.gold : C.textMuted, fontSize: 13, fontWeight: a ? 500 : 300,
                cursor: "pointer", transition: "all 0.25s",
                background: a ? C.goldSubtle : "transparent",
                borderLeft: a ? `2px solid ${C.gold}` : "2px solid transparent",
              }}
                onMouseEnter={e => { if (!a) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={e => { if (!a) e.currentTarget.style.background = a ? C.goldSubtle : "transparent"; }}>
                <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{it.icon}</span>
                {sideOpen && <span style={{ letterSpacing: "0.12em", flex: 1 }}>{it.label}</span>}
                {sideOpen && hasNotif && <span style={{ fontSize: 9, fontFamily: mono, padding: "1px 7px", background: C.redBg, color: C.red, borderRadius: 10 }}>{unreadMessages}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: sideOpen ? "14px 20px" : "14px 14px", borderTop: `1px solid ${C.panelBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldSubtle, border: `1px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.gold, fontWeight: 600, fontFamily: mono }}>AS</div>
            {sideOpen && <div>
              <div style={{ fontSize: 11, color: C.text }}>Anton S.</div>
              <div style={{ fontSize: 9, color: C.textDark }}>Beheerder</div>
            </div>}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ marginLeft: sw, height: "100vh", transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{sections[nav]?.()}</div>
      </main>

      {/* ═══ MODALS ═══ */}

      {/* Client detail */}
      <Modal open={!!selectedClient} onClose={() => setSelectedClient(null)} title="KLANT DETAIL" width={640}>
        {selectedClient && <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.goldSubtle, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.gold, fontWeight: 600, fontFamily: mono }}>{selectedClient.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, color: C.white, fontWeight: 400 }}>{selectedClient.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{selectedClient.company} · Lid sinds {selectedClient.since}</div>
            </div>
            <div style={{ textAlign: "right" }}><TierBadge tier={selectedClient.tier} /><div style={{ marginTop: 6 }}><StatusBadge status={selectedClient.status} /></div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ l: "MAANDBEDRAG", v: `€${selectedClient.monthlyFee.toLocaleString()}` }, { l: "TOTAAL BESTEED", v: fmtEuro(selectedClient.totalSpent) }, { l: "WAGENS", v: selectedClient.vehicles.length }].map((d, i) => (
              <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 3 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                <div style={{ fontSize: 18, color: C.goldBright, fontFamily: mono, marginTop: 4 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: C.text, fontWeight: 500, marginBottom: 10 }}>WAGENS</div>
          {selectedClient.vehicles.map(v => (
            <div key={v.id} style={{ padding: "12px 16px", background: C.surface, borderRadius: 3, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: C.text }}>{v.make} {v.name}</div>
                <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, marginTop: 2 }}>{v.plate} · {v.color} · {v.mileage}</div>
              </div>
              <div style={{ textAlign: "right" }}><StatusBadge status={v.status} /><div style={{ fontSize: 12, color: C.gold, fontFamily: mono, marginTop: 4 }}>{fmtEuro(v.value)}</div></div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {[{ l: "EMAIL", v: selectedClient.email }, { l: "TELEFOON", v: selectedClient.phone }].map((d, i) => (
              <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                <div style={{ fontSize: 12, color: C.text, fontFamily: mono, marginTop: 3 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn primary style={{ flex: 1 }} onClick={() => { setSelectedClient(null); setComposeOpen(true); setComposeClient(selectedClient.name); }}>BERICHT STUREN</Btn>
            <Btn style={{ flex: 1 }}>FACTUURHISTORIEK</Btn>
          </div>
        </div>}
      </Modal>

      {/* Service detail */}
      <Modal open={!!selectedService} onClose={() => setSelectedService(null)} title="SERVICE DETAIL">
        {selectedService && (() => {
          const v = getVehicle(selectedService.vehicleId);
          const cl = getClient(selectedService.clientId);
          return <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge status={selectedService.status} />
              <span style={{ fontSize: 10, fontFamily: mono, padding: "3px 10px", background: selectedService.priority === "high" ? C.redBg : C.surface, color: selectedService.priority === "high" ? C.red : C.textMuted, border: `1px solid ${selectedService.priority === "high" ? C.red + "40" : C.panelBorder}`, borderRadius: 2 }}>
                {selectedService.priority.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 16, color: C.white, marginBottom: 8 }}>{selectedService.type}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>{selectedService.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { l: "WAGEN", v: `${v?.make} ${v?.name}` },
                { l: "KLANT", v: cl?.name },
                { l: "TECHNICUS", v: selectedService.tech },
                { l: "DATUM", v: selectedService.date },
                { l: "GESCHATTE KOST", v: `€${selectedService.estimatedCost.toLocaleString()}` },
                { l: "NUMMERPLAAT", v: v?.plate },
              ].map((d, i) => (
                <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                  <div style={{ fontSize: 13, color: C.goldBright, fontFamily: mono, marginTop: 3 }}>{d.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {selectedService.status === "scheduled" && <Btn primary style={{ flex: 1 }}>START SERVICE</Btn>}
              {selectedService.status === "in-progress" && <Btn primary style={{ flex: 1 }}>MARKEER ALS VOLTOOID</Btn>}
              <Btn style={{ flex: 1 }} onClick={() => { setSelectedService(null); setComposeOpen(true); setComposeClient(cl?.name || ""); setComposeSubject(`Update: ${selectedService.type}`); }}>UPDATE STUREN</Btn>
            </div>
          </div>;
        })()}
      </Modal>

      {/* Invoice detail */}
      <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="FACTUUR DETAIL">
        {selectedInvoice && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono }}>{selectedInvoice.id.toUpperCase()}</div>
              <div style={{ fontSize: 20, color: C.goldBright, fontFamily: mono, fontWeight: 500, marginTop: 4 }}>€{selectedInvoice.amount.toLocaleString()}</div>
            </div>
            <StatusBadge status={selectedInvoice.status} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { l: "KLANT", v: selectedInvoice.clientName },
              { l: "TYPE", v: selectedInvoice.type },
              { l: "PERIODE / BESCHRIJVING", v: selectedInvoice.period || selectedInvoice.desc },
              { l: "DATUM", v: selectedInvoice.date },
            ].map((d, i) => (
              <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                <div style={{ fontSize: 13, color: C.text, marginTop: 3 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {selectedInvoice.status === "draft" && <Btn primary style={{ flex: 1 }}>VERSTUREN</Btn>}
            {selectedInvoice.status === "overdue" && <Btn primary style={{ flex: 1 }}>HERINNERING STUREN</Btn>}
            {selectedInvoice.status === "pending" && <Btn primary style={{ flex: 1 }}>MARKEER ALS BETAALD</Btn>}
            <Btn style={{ flex: 1 }}>DOWNLOAD PDF</Btn>
          </div>
        </div>}
      </Modal>

      {/* Vehicle detail */}
      <Modal open={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} title="WAGEN DETAIL">
        {selectedVehicle && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted }}>{selectedVehicle.make.toUpperCase()}</div>
              <div style={{ fontSize: 22, color: C.white, fontWeight: 300, marginTop: 2 }}>{selectedVehicle.name}</div>
            </div>
            <StatusBadge status={selectedVehicle.status} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { l: "EIGENAAR", v: selectedVehicle.clientName },
              { l: "NUMMERPLAAT", v: selectedVehicle.plate },
              { l: "KLEUR", v: selectedVehicle.color },
              { l: "BOUWJAAR", v: selectedVehicle.year },
              { l: "KILOMETERSTAND", v: selectedVehicle.mileage },
              { l: "WAARDE", v: fmtEuro(selectedVehicle.value) },
            ].map((d, i) => (
              <div key={i} style={{ padding: "12px 14px", background: C.surface, borderRadius: 3 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                <div style={{ fontSize: 13, color: i === 5 ? C.goldBright : C.text, fontFamily: mono, marginTop: 3 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 14px", background: C.surface, borderRadius: 3, marginBottom: 20 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>VOLGENDE SERVICE</div>
            <div style={{ fontSize: 14, color: C.gold, fontFamily: mono, marginTop: 3 }}>{selectedVehicle.nextService}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn primary style={{ flex: 1 }} onClick={() => { setSelectedVehicle(null); setNewServiceOpen(true); }}>SERVICE INPLANNEN</Btn>
            <Btn style={{ flex: 1 }}>HISTORIEK</Btn>
          </div>
        </div>}
      </Modal>

      {/* Compose message */}
      <Modal open={composeOpen} onClose={() => { setComposeOpen(false); setComposeClient(""); setComposeSubject(""); setComposeBody(""); }} title="NIEUW BERICHT" width={580}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>AAN (KLANT)</div>
            <select value={composeClient} onChange={e => setComposeClient(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
              <option value="">Selecteer klant...</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>ONDERWERP</div>
            <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Onderwerp..."
              style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>BERICHT</div>
            <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={6} placeholder="Typ uw bericht..."
              style={{ width: "100%", padding: "12px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn primary style={{ flex: 1 }}>VERSTUREN</Btn>
            <Btn style={{ flex: 1 }} onClick={() => { setComposeOpen(false); setComposeClient(""); setComposeSubject(""); setComposeBody(""); }}>ANNULEREN</Btn>
          </div>
        </div>
      </Modal>

      {/* New service */}
      <Modal open={newServiceOpen} onClose={() => setNewServiceOpen(false)} title="NIEUWE SERVICE" width={580}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>KLANT</div>
            <select style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
              <option value="">Selecteer klant...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>WAGEN</div>
            <select style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
              <option value="">Selecteer wagen...</option>
              {allVehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.name} — {v.clientName}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>TYPE SERVICE</div>
            <select style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
              <option>Full Service</option><option>Tire Change</option><option>Detailing</option><option>Pickup & Delivery</option><option>Storage Prep</option><option>Annual Inspection</option><option>Overig</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>DATUM</div>
              <input type="date" style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>TECHNICUS</div>
              <select style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
                {team.filter(t => t.role !== "Client Relations").map(t => <option key={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>PRIORITEIT</div>
              <select style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }}>
                <option>Normal</option><option>High</option><option>Low</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>GESCHATTE KOST (€)</div>
              <input type="number" placeholder="0" style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>BESCHRIJVING</div>
            <textarea rows={3} placeholder="Beschrijf de service..." style={{ width: "100%", padding: "12px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn primary style={{ flex: 1 }}>SERVICE AANMAKEN</Btn>
            <Btn style={{ flex: 1 }} onClick={() => setNewServiceOpen(false)}>ANNULEREN</Btn>
          </div>
        </div>
      </Modal>

      {/* Vehicle Create/Edit modal */}
      <Modal open={newVehicleOpen} onClose={() => { setNewVehicleOpen(false); resetVehicleForm(); setEditingVehicleId(null); }} title={editingVehicleId ? "VOERTUIG BEWERKEN" : "NIEUW VOERTUIG"} width={580}>
        {(() => {
          const selectStyle = { width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" };
          const inputStyle = { ...selectStyle };
          const modelsForBrand = vehicleForm.model_id ? dbModels : dbModels.filter(m => {
            const selectedBrandId = dbModels.find(mm => mm.id === vehicleForm.model_id)?.brand_id;
            return !selectedBrandId || m.brand_id === selectedBrandId;
          });
          return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Client */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>KLANT *</div>
              {dbClients.length > 0 ? (
                <select value={vehicleForm.client_id} onChange={e => setVehicleForm({ ...vehicleForm, client_id: e.target.value })} style={selectStyle}>
                  <option value="">Selecteer klant...</option>
                  {dbClients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company || "Privé"}</option>)}
                </select>
              ) : (
                <div style={{ padding: "14px 16px", background: C.surface, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.orange }}>⚠ Geen klanten in database</span>
                  <Btn small primary onClick={seedDemoClients}>DEMO KLANTEN IMPORTEREN</Btn>
                </div>
              )}
            </div>

            {/* Model (optional) */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>MODEL (optioneel — koppelt automatisch 3D)</div>
              <select value={vehicleForm.model_id} onChange={e => setVehicleForm({ ...vehicleForm, model_id: e.target.value })} style={selectStyle}>
                <option value="">Geen model gekoppeld</option>
                {dbBrands.map(b => {
                  const bModels = dbModels.filter(m => m.brand_id === b.id);
                  if (bModels.length === 0) return null;
                  return bModels.map(m => (
                    <option key={m.id} value={m.id}>{b.name} — {m.name} {m.year ? `(${m.year})` : ""} {m.model_3d_path ? "✓ 3D" : ""}</option>
                  ));
                })}
              </select>
            </div>

            {/* Plate + Color */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>NUMMERPLAAT *</div>
                <input value={vehicleForm.plate} onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value })} placeholder="1-ABC-123" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>KLEUR</div>
                <input value={vehicleForm.color} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="Rosso Corsa" style={inputStyle} />
              </div>
            </div>

            {/* Mileage + Value */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>KILOMETERSTAND</div>
                <input value={vehicleForm.mileage} onChange={e => setVehicleForm({ ...vehicleForm, mileage: e.target.value })} placeholder="12,340 km" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>WAARDE (€)</div>
                <input value={vehicleForm.value} onChange={e => setVehicleForm({ ...vehicleForm, value: e.target.value })} placeholder="450000" type="number" style={inputStyle} />
              </div>
            </div>

            {/* Status + Next service */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>STATUS</div>
                <select value={vehicleForm.status} onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })} style={selectStyle}>
                  <option value="garaged">In garage</option>
                  <option value="in-service">In service</option>
                  <option value="pickup-scheduled">Ophaling gepland</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>VOLGENDE SERVICE</div>
                <input value={vehicleForm.next_service} onChange={e => setVehicleForm({ ...vehicleForm, next_service: e.target.value })} type="date" style={inputStyle} />
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Btn primary style={{ flex: 1 }} onClick={editingVehicleId ? updateVehicle : addVehicle}>
                {editingVehicleId ? "OPSLAAN" : "VOERTUIG AANMAKEN"}
              </Btn>
              <Btn style={{ flex: 1 }} onClick={() => { setNewVehicleOpen(false); resetVehicleForm(); setEditingVehicleId(null); }}>ANNULEREN</Btn>
            </div>
          </div>;
        })()}
      </Modal>

      {/* Vehicle ↔ Model link modal */}
      <Modal open={!!editVehicleId} onClose={() => { setEditVehicleId(null); setEditVehicleBrand(""); setEditVehicleModel(""); }} title="VOERTUIG KOPPELEN AAN MODEL" width={520}>
        {editVehicleId && (() => {
          const vehicle = allVehicles.find(v => v.id === editVehicleId);
          const modelsForBrand = dbModels.filter(m => m.brand_id === editVehicleBrand);
          const selectedModelObj = dbModels.find(m => m.id === editVehicleModel);
          const has3D = !!selectedModelObj?.model_3d_path;
          const selectStyle = { width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.panelBorder}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: sans, outline: "none" };

          return <div>
            {/* Vehicle info */}
            <div style={{ padding: "14px 16px", background: C.surface, borderRadius: 4, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: C.textMuted, marginBottom: 4 }}>VOERTUIG</div>
              <div style={{ fontSize: 16, color: C.white }}>{vehicle?.make} {vehicle?.name}</div>
              <div style={{ fontSize: 11, color: C.textDark, fontFamily: mono, marginTop: 2 }}>{vehicle?.plate} · {vehicle?.clientName}</div>
            </div>

            {/* Brand select */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>SELECTEER MERK</div>
              <select value={editVehicleBrand} onChange={e => { setEditVehicleBrand(e.target.value); setEditVehicleModel(""); }} style={selectStyle}>
                <option value="">Kies een merk...</option>
                {dbBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Model select */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 6 }}>SELECTEER MODEL</div>
              <select value={editVehicleModel} onChange={e => setEditVehicleModel(e.target.value)} style={selectStyle} disabled={!editVehicleBrand}>
                <option value="">Kies een model...</option>
                {modelsForBrand.map(m => <option key={m.id} value={m.id}>{m.name} {m.year ? `(${m.year})` : ""}</option>)}
              </select>
            </div>

            {/* 3D status preview */}
            {editVehicleModel && (
              <div style={{
                padding: "12px 16px", borderRadius: 4, marginBottom: 16,
                background: has3D ? C.greenBg : C.surface,
                border: `1px solid ${has3D ? C.green + "30" : C.panelBorder}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: has3D ? C.green : C.textDark }} />
                  <span style={{ fontSize: 11, color: has3D ? C.green : C.textMuted, fontWeight: 500 }}>
                    {has3D ? "3D MODEL BESCHIKBAAR" : "GEEN 3D MODEL — Upload via Instellingen → Modellen"}
                  </span>
                </div>
                {has3D && selectedModelObj?.model_3d_path && (
                  <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, marginTop: 4 }}>{selectedModelObj.model_3d_path}</div>
                )}
              </div>
            )}

            {dbBrands.length === 0 && (
              <div style={{ padding: "16px", background: C.surface, borderRadius: 4, marginBottom: 16, fontSize: 12, color: C.orange }}>
                ⚠ Geen merken beschikbaar. Ga naar Instellingen om merken en modellen toe te voegen.
              </div>
            )}

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn primary style={{ flex: 1 }} onClick={() => {
                if (editVehicleModel) {
                  saveVehicleLink(editVehicleId, editVehicleModel);
                }
                setEditVehicleId(null);
                setEditVehicleBrand("");
                setEditVehicleModel("");
              }}>OPSLAAN</Btn>
              <Btn style={{ flex: 1 }} onClick={() => { setEditVehicleId(null); setEditVehicleBrand(""); setEditVehicleModel(""); }}>ANNULEREN</Btn>
            </div>
          </div>;
        })()}
      </Modal>
    </div>
  );
}
