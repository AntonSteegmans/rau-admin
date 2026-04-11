import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */
const C = {
  bg: "#0a0a0a", panel: "#111111", panelHover: "#181818", panelBorder: "#1e1e1e",
  surface: "#161616", surfaceHover: "#1c1c1c", surfaceActive: "#242424",
  accent: "#8a9a6e", accentBright: "#a0b27e", accentDim: "rgba(138,154,110,0.35)",
  accentSubtle: "rgba(138,154,110,0.08)", accentSubtle2: "rgba(138,154,110,0.15)",
  gold: "#8a9a6e", goldBright: "#a0b27e", goldDim: "rgba(138,154,110,0.35)",
  goldSubtle: "rgba(138,154,110,0.08)", goldSubtle2: "rgba(138,154,110,0.15)",
  white: "#e8e8e4", text: "#b0b0a8", textMuted: "#6a6a64", textDark: "#3e3e3a",
  red: "#c45050", redDim: "rgba(196,80,80,0.12)", redBg: "rgba(196,80,80,0.06)",
  green: "#7a9e6a", greenDim: "rgba(122,158,106,0.12)", greenBg: "rgba(122,158,106,0.06)",
  blue: "#6a8eaa", blueDim: "rgba(106,142,170,0.12)", blueBg: "rgba(106,142,170,0.06)",
  orange: "#b08a5a", orangeDim: "rgba(176,138,90,0.12)",
  purple: "#8a7aaa", purpleDim: "rgba(138,122,170,0.12)",
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
   3D CAR SCENE — GLB Model Loader + Color Change
   ═══════════════════════════════════════════ */
function buildCar(canvas, modelUrl, initialBodyColor) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return { cleanup: () => {}, setBodyColor: () => {} };

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.7;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Scene — dark moody studio
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  // Camera
  const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 200);
  cam.position.set(6, 2.2, 6);
  cam.lookAt(0, 0.3, 0);

  // Floor — visible dark reflective surface with light pool
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.2, metalness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Soft edge ring around the floor (fades to background)
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = 512; edgeCanvas.height = 512;
  const edgeCtx = edgeCanvas.getContext('2d');
  const edgeGrad = edgeCtx.createRadialGradient(256, 256, 80, 256, 256, 256);
  edgeGrad.addColorStop(0, 'rgba(25,25,25,1)');
  edgeGrad.addColorStop(0.6, 'rgba(18,18,18,0.8)');
  edgeGrad.addColorStop(1, 'rgba(10,10,10,0)');
  edgeCtx.fillStyle = edgeGrad;
  edgeCtx.fillRect(0, 0, 512, 512);
  const edgeTex = new THREE.CanvasTexture(edgeCanvas);
  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshBasicMaterial({ map: edgeTex, transparent: true, depthWrite: false })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -0.01;
  scene.add(floorGlow);

  // Floor spotlight — creates visible pool of light
  const floorSpot = new THREE.SpotLight(0xffffff, 2.0, 20, Math.PI / 4, 1.0, 1);
  floorSpot.position.set(0, 10, 0);
  floorSpot.lookAt(0, 0, 0);
  scene.add(floorSpot);

  // Contact shadow — soft dark ellipse under the car
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const ctx = shadowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
  gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.005, 0);
  scene.add(contactShadow);

  // Lighting — dramatic but bright on the car
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
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
  const keyLight = new THREE.SpotLight(0xffffff, 5.0, 35, Math.PI / 4, 0.5);
  keyLight.position.set(6, 6, 5); keyLight.lookAt(0, 0, 0); scene.add(keyLight);
  const fillLight = new THREE.SpotLight(0xeeeeff, 2.5, 35, Math.PI / 3, 0.6);
  fillLight.position.set(-7, 5, 2); fillLight.lookAt(0, 0, 0); scene.add(fillLight);
  const rimLight = new THREE.SpotLight(0xffffff, 4.0, 30, Math.PI / 5, 0.4);
  rimLight.position.set(-2, 4, -7); rimLight.lookAt(0, 0.5, 0); scene.add(rimLight);
  const topLight = new THREE.PointLight(0xffffff, 2.5, 30);
  topLight.position.set(0, 12, 0); scene.add(topLight);
  // Extra front light to illuminate the front of the car
  const frontLight = new THREE.SpotLight(0xffffff, 2.0, 30, Math.PI / 4, 0.5);
  frontLight.position.set(-6, 3, 5); frontLight.lookAt(0, 0.5, 0); scene.add(frontLight);
  // Low side fill to reduce harsh shadows underneath
  const lowFill = new THREE.PointLight(0xddddff, 1.0, 15);
  lowFill.position.set(4, 0.5, 0); scene.add(lowFill);

  // Track body materials for color changes
  const bodyMaterials = [];

  // Detect if a material is likely a car body material
  const isBodyMaterial = (mesh, material) => {
    const name = (material.name || mesh.name || "").toLowerCase();
    // Skip known non-body parts
    const skip = ["glass", "window", "windshield", "tire", "tyre", "rubber", "wheel",
      "rim", "chrome", "mirror", "light", "lamp", "led", "interior", "seat",
      "dashboard", "carpet", "fabric", "leather", "grill", "grille", "exhaust",
      "brake", "caliper", "license", "plate", "emblem", "logo", "badge"];
    if (skip.some(s => name.includes(s))) return false;

    // Body materials tend to be metallic/glossy and cover large surfaces
    const isMetallic = material.metalness > 0.3 || material.roughness < 0.5;
    const isColored = material.color && !(material.color.r < 0.1 && material.color.g < 0.1 && material.color.b < 0.1); // not pure black
    const isNotTransparent = !material.transparent || material.opacity > 0.8;

    // Check geometry size — body panels are large
    let isLarge = false;
    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);
        isLarge = Math.max(size.x, size.y, size.z) > 0.1;
      }
    }

    // Positive indicators
    const bodyHints = ["body", "paint", "car", "hood", "fender", "door", "bumper",
      "roof", "trunk", "bonnet", "panel", "shell", "exterior", "carrosserie", "lak"];
    const isNamedBody = bodyHints.some(h => name.includes(h));

    return isNamedBody || (isLarge && isMetallic && isNotTransparent);
  };

  // Load model
  const carGroup = new THREE.Group();
  scene.add(carGroup);

  // Process any loaded model (shared logic for all formats)
  const processModel = (model) => {
    // Scale
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 8.0 / maxDim;
    model.scale.setScalar(scale);

    // Center
    const sBox = new THREE.Box3().setFromObject(model);
    const sCenter = sBox.getCenter(new THREE.Vector3());
    model.position.x -= sCenter.x;
    model.position.z -= sCenter.z;
    model.position.y -= sBox.min.y;

    // Detect body materials + apply initial color
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Ensure material has color property (STL meshes may not)
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat.color && isBodyMaterial(child, mat)) {
            mat.userData.originalColor = mat.color.clone();
            bodyMaterials.push(mat);
          }
        });
      }
    });

    // Apply initial color if provided
    if (initialBodyColor && bodyMaterials.length > 0) {
      const color = new THREE.Color(initialBodyColor);
      bodyMaterials.forEach(mat => { mat.color.copy(color); mat.needsUpdate = true; });
    }

    carGroup.add(model);
    console.log(`Model loaded! ${bodyMaterials.length} body materials detected.`);
  };

  if (modelUrl) {
    // Detect format from URL
    const ext = modelUrl.split("?")[0].split(".").pop().toLowerCase();
    const onProgress = (p) => { if (p.total) console.log(`Loading: ${Math.round(p.loaded / p.total * 100)}%`); };
    const onError = (err) => console.error(`Error loading .${ext}:`, err);

    if (ext === "glb" || ext === "gltf") {
      const gltfLoader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      gltfLoader.setDRACOLoader(dracoLoader);
      gltfLoader.load(modelUrl, (gltf) => processModel(gltf.scene), onProgress, onError);

    } else if (ext === "fbx") {
      const fbxLoader = new FBXLoader();
      fbxLoader.load(modelUrl, (fbx) => processModel(fbx), onProgress, onError);

    } else if (ext === "obj") {
      const objLoader = new OBJLoader();
      objLoader.load(modelUrl, (obj) => {
        // OBJ files often have no materials — apply a default metallic one
        obj.traverse((child) => {
          if (child.isMesh && (!child.material || child.material.type === "MeshBasicMaterial")) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
          }
        });
        processModel(obj);
      }, onProgress, onError);

    } else if (ext === "stl") {
      const stlLoader = new STLLoader();
      stlLoader.load(modelUrl, (geometry) => {
        // STL returns geometry, not a scene — wrap it in a mesh
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
        const mesh = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(mesh);
        processModel(group);
      }, onProgress, onError);

    } else {
      console.warn(`Onbekend bestandsformaat: .${ext} — probeer GLB/FBX/OBJ/STL`);
    }
  }

  // Color change function — call this from React
  const setBodyColor = (hexColor) => {
    if (!hexColor || bodyMaterials.length === 0) return;
    const color = new THREE.Color(hexColor);
    bodyMaterials.forEach(mat => { mat.color.copy(color); mat.needsUpdate = true; });
  };

  // Reset to original colors
  const resetBodyColor = () => {
    bodyMaterials.forEach(mat => {
      if (mat.userData.originalColor) {
        mat.color.copy(mat.userData.originalColor);
        mat.needsUpdate = true;
      }
    });
  };

  // OrbitControls — drag to rotate, scroll to zoom
  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI / 2.1; // Don't go below floor
  controls.target.set(0, 0.5, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;

  // Stop auto-rotate when user interacts, restart after 3s idle
  let idleTimer = null;
  const stopAutoRotate = () => {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { controls.autoRotate = true; }, 3000);
  };
  canvas.addEventListener("pointerdown", stopAutoRotate);
  canvas.addEventListener("wheel", stopAutoRotate);

  // Animation loop
  let af;
  const anim = () => {
    af = requestAnimationFrame(anim);
    controls.update();
    renderer.render(scene, cam);
  };
  anim();

  const onR = () => { const nw = canvas.clientWidth, nh = canvas.clientHeight; cam.aspect = nw / nh; cam.updateProjectionMatrix(); renderer.setSize(nw, nh); };
  window.addEventListener("resize", onR);

  return {
    cleanup: () => {
      cancelAnimationFrame(af);
      canvas.removeEventListener("pointerdown", stopAutoRotate);
      canvas.removeEventListener("wheel", stopAutoRotate);
      window.removeEventListener("resize", onR);
      clearTimeout(idleTimer);
      controls.dispose();
      renderer.dispose();
    },
    setBodyColor,
    resetBodyColor,
  };
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
  return <span style={{ fontSize: 9, fontFamily: mono, padding: "4px 12px", background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase" }}>{s.label}</span>;
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
  const mobile = window.innerWidth < 768;
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: mobile ? "12px 12px 0 0" : 6, width: mobile ? "100%" : "94%", maxWidth: mobile ? "100%" : (width || 560), maxHeight: mobile ? "90vh" : "85vh", overflow: "auto" }}>
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
export default function AdminDashboard({ user, onSignOut }) {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [sideOpen, setSideOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [selectedBodyColor, setSelectedBodyColor] = useState(null);
  const sceneRef = useRef(null); // holds { cleanup, setBodyColor, resetBodyColor }
  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbClients, setDbClients] = useState([]);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ client_id: "", model_id: "", plate: "", color: "", mileage: "", status: "garaged", next_service: "", value: "", display_mode: "3d", image_path: "" });
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleImageUploading, setVehicleImageUploading] = useState(false);

  // Supabase state — services, facturen, berichten, team
  const [dbServices, setDbServices] = useState([]);
  const [dbInvoices, setDbInvoices] = useState([]);
  const [dbMessages, setDbMessages] = useState([]);
  const [dbTeam, setDbTeam] = useState([]);

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
    const { data } = await supabase.from("clients")
      .select("*, vehicles(id, plate, color, mileage, status, value, next_service, models(name, brands(name)))")
      .order("name");
    if (data) setDbClients(data);
  };

  const formatRelTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return "Zojuist";
    if (h < 24) return `${h}u geleden`;
    if (d < 7) return `${d}d geleden`;
    return new Date(ts).toLocaleDateString("nl-BE");
  };

  const loadServices = async () => {
    const { data } = await supabase.from("services")
      .select("*, vehicles(id, plate, models(name, brands(name))), clients(name)")
      .order("date");
    if (data) setDbServices(data.map(s => ({
      ...s,
      vehicleId: s.vehicle_id,
      clientId: s.client_id,
      tech: s.technician,
      estimatedCost: s.estimated_cost ?? 0,
      desc: s.description,
    })));
  };

  const loadInvoices = async () => {
    const { data } = await supabase.from("invoices")
      .select("*, clients(name)")
      .order("date", { ascending: false });
    if (data) setDbInvoices(data.map(inv => ({
      ...inv,
      clientName: inv.clients?.name ?? "—",
    })));
  };

  const loadMessages = async () => {
    const { data } = await supabase.from("messages")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    if (data) setDbMessages(data.map(m => ({
      ...m,
      clientName: m.clients?.name ?? "—",
      preview: m.body,
      time: formatRelTime(m.created_at),
    })));
  };

  const loadTeam = async () => {
    const { data } = await supabase.from("team").select("*").order("name");
    if (data) setDbTeam(data.map(t => ({ ...t, active: t.active_tasks ?? 0 })));
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
  useEffect(() => { loadBrands(); loadModels(); loadVehicles(); loadClients(); loadServices(); loadInvoices(); loadMessages(); loadTeam(); }, []);

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
    const ext = file.name.split(".").pop().toLowerCase();
    const filePath = `${modelId}.${ext}`;

    // Content types per format
    const contentTypes = {
      glb: "model/gltf-binary", gltf: "model/gltf+json",
      fbx: "application/octet-stream", obj: "text/plain",
      stl: "application/octet-stream",
    };

    // Remove old file if exists (could be a different format)
    const model = dbModels.find(m => m.id === modelId);
    if (model?.model_3d_path) {
      await supabase.storage.from("3d-models").remove([model.model_3d_path]);
    }

    const { error: uploadError } = await supabase.storage.from("3d-models").upload(filePath, file, {
      upsert: true,
      contentType: contentTypes[ext] || "application/octet-stream",
    });
    if (uploadError) { flash("Upload fout: " + uploadError.message); setUploading(false); return; }

    await supabase.from("models").update({ model_3d_path: filePath }).eq("id", modelId);
    flash(`3D model geüpload! (.${ext})`);
    setUploading(false);
    loadModels();
  };

  // ── VEHICLE CRUD ──
  const resetVehicleForm = () => setVehicleForm({ client_id: "", model_id: "", plate: "", color: "", mileage: "", status: "garaged", next_service: "", value: "", display_mode: "3d", image_path: "" });

  const uploadVehicleImage = async (file) => {
    setVehicleImageUploading(true);
    const ext = file.name.split(".").pop().toLowerCase();
    const filePath = `vehicle-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("3d-models").upload(filePath, file, { upsert: true });
    setVehicleImageUploading(false);
    if (error) { flash("Fout bij uploaden: " + error.message); return null; }
    return filePath;
  };

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
      display_mode: f.display_mode || "3d",
      image_path: f.image_path || null,
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
      display_mode: f.display_mode || "3d",
      image_path: f.image_path || null,
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
    if (sceneRef.current) { sceneRef.current = null; }

    const vehicle = allVehicles[dashCarIdx % allVehicles.length];
    const modelUrl = vehicle ? get3DUrl(vehicle.id) : null;
    // Get saved color for this vehicle
    const savedColor = vehicle ? (localStorage.getItem(`rau_color_${vehicle.id}`) || null) : null;
    setSelectedBodyColor(savedColor);

    if (modelUrl) {
      setNo3DModel(false);
      setCurrent3DUrl(modelUrl);
      const result = buildCar(canvasRef.current, modelUrl, savedColor);
      cleanRef.current = result.cleanup;
      sceneRef.current = result;
    } else {
      setNo3DModel(true);
      setCurrent3DUrl(null);
      const result = buildCar(canvasRef.current, null, null);
      cleanRef.current = result.cleanup;
      sceneRef.current = result;
    }
    return () => { if (cleanRef.current) cleanRef.current(); };
  }, [nav, dashCarIdx, vehicleLinks, dbModels]);

  // Change body color in realtime
  const changeBodyColor = (hex) => {
    setSelectedBodyColor(hex);
    if (sceneRef.current?.setBodyColor) sceneRef.current.setBodyColor(hex);
    // Save per vehicle
    const vehicle = allVehicles[dashCarIdx % allVehicles.length];
    if (vehicle && hex) {
      localStorage.setItem(`rau_color_${vehicle.id}`, hex);
    }
  };

  const resetColor = () => {
    setSelectedBodyColor(null);
    if (sceneRef.current?.resetBodyColor) sceneRef.current.resetBodyColor();
    const vehicle = allVehicles[dashCarIdx % allVehicles.length];
    if (vehicle) localStorage.removeItem(`rau_color_${vehicle.id}`);
  };
  const activeClients = dbClients.filter(c => c.status === "active").length;
  const monthlyRevenue = dbClients.filter(c => c.status === "active").reduce((s, c) => s + (c.monthly_fee ?? 0), 0);
  const pendingServices = dbServices.filter(s => s.status !== "completed").length;
  const unreadMessages = dbMessages.filter(m => !m.read).length;
  const sw = 0; // Full width — sidebar is overlay-only

  const getVehicle = (vid) => allVehicles.find(v => v.id === vid);
  const getClient = (cid) => dbClients.find(c => c.id === cid);

  /* ═══ DASHBOARD ═══ */
  const dashVehicle = allVehicles[dashCarIdx % allVehicles.length];
  const dashLinkedModel = dashVehicle ? getLinkedModel(dashVehicle.id) : null;
  const dashBrand = dashLinkedModel ? getLinkedBrand(dashLinkedModel) : null;
  const dashDisplayName = dashLinkedModel ? `${dashBrand?.name || ""} ${dashLinkedModel.name}` : `${dashVehicle?.make || ""} ${dashVehicle?.name || ""}`;

  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0a0a0a" }}>
      {/* ─── 3D HERO — full-bleed ─── */}
      <div style={{ flex: "1 1 68%", position: "relative", minHeight: isMobile ? 280 : 400 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* Vignette overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
          background: "radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
          background: "linear-gradient(transparent, rgba(10,10,10,0.95))", pointerEvents: "none", zIndex: 4 }} />
        {/* Top fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100,
          background: "linear-gradient(rgba(10,10,10,0.5), transparent)", pointerEvents: "none", zIndex: 4 }} />

        {/* No 3D model placeholder */}
        {no3DModel && (
          <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, pointerEvents: "none" }}>
            <div style={{ fontSize: 48, opacity: 0.1, color: C.white }}>⬡</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>GEEN 3D MODEL</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center", maxWidth: 300 }}>
              Koppel dit voertuig aan een model via Fleet
            </div>
          </div>
        )}

        {/* ── Top bar overlay ── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: isMobile ? "20px 20px" : "28px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Left: hamburger + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24 }}>
            {/* Hamburger */}
            <div onClick={() => setMobileMenuOpen(true)} style={{
              width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              transition: "all 0.2s", background: "rgba(255,255,255,0.02)",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <line x1="0" y1="6" x2="16" y2="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <line x1="0" y1="11" x2="16" y2="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              </svg>
            </div>
            {/* Logo */}
            <span style={{ fontSize: isMobile ? 20 : 26, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.white, letterSpacing: "0.06em" }}>raù</span>
          </div>

          {/* Right: icons */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
            {[
              { icon: "☾", label: "Dark mode" },
              { icon: "✉", label: "Berichten", notif: unreadMessages > 0 },
              { icon: "○", label: "Profiel", isProfile: true },
            ].map((btn, i) => (
              <div key={i} onClick={() => { if (btn.label === "Berichten") setNav("messages"); if (btn.isProfile) setMobileMenuOpen(true); }} style={{
                width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "all 0.2s", position: "relative", fontSize: 15,
                color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.02)",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {btn.icon}
                {btn.notif && <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: C.red }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Welcome text — below top bar */}
        <div style={{ position: "absolute", top: isMobile ? 80 : 90, left: isMobile ? 20 : 36, zIndex: 10 }}>
          <div style={{ fontSize: isMobile ? 24 : 36, color: C.white, fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            Welkom terug, Anton
          </div>
        </div>

        {/* Value — top right below icons */}
        <div style={{ position: "absolute", top: isMobile ? 80 : 90, right: isMobile ? 20 : 36, zIndex: 10, textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>WAARDE</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7a9e6a" }} />
            <span style={{ fontSize: isMobile ? 20 : 28, color: C.white, fontWeight: 300, fontFamily: mono, letterSpacing: "-0.02em" }}>
              € {dashVehicle?.value ? dashVehicle.value.toLocaleString("nl-BE") : "0"}
            </span>
          </div>
        </div>

        {/* ── Bottom overlay — car info ── */}
        <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, zIndex: 10, padding: isMobile ? "0 20px" : "0 36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {/* Left: car name */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)", fontWeight: 400, marginBottom: 6 }}>IN FOCUS</div>
              <div style={{ fontSize: isMobile ? 22 : 34, color: C.white, fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                {dashDisplayName.trim() || "Selecteer een voertuig"}
              </div>
              <div style={{ marginTop: 10 }}><StatusBadge status={dashVehicle?.status || "garaged"} /></div>
            </div>

            {/* Right: nav arrows */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {allVehicles.length > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  <div onClick={() => setDashCarIdx(i => (i - 1 + allVehicles.length) % allVehicles.length)} style={{
                    width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    color: "rgba(255,255,255,0.4)", fontSize: 16, transition: "all 0.2s", background: "rgba(255,255,255,0.03)",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                  >‹</div>
                  <div onClick={() => setDashCarIdx(i => (i + 1) % allVehicles.length)} style={{
                    width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    color: "rgba(255,255,255,0.4)", fontSize: 16, transition: "all 0.2s", background: "rgba(255,255,255,0.03)",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                  >›</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Color swatches — floating right side */}
        {!no3DModel && (
          <div style={{
            position: "absolute", right: isMobile ? 16 : 36, bottom: isMobile ? 75 : 75, zIndex: 12,
            display: "flex", gap: 5, alignItems: "center",
          }}>
            {[
              { name: "Rosso", hex: "#cc2020" },
              { name: "Nero", hex: "#1a1a1a" },
              { name: "Bianco", hex: "#e8e6e0" },
              { name: "Grigio", hex: "#8a8a8a" },
              { name: "Blu", hex: "#1e3a6a" },
              { name: "Verde", hex: "#1a4a2a" },
              { name: "Giallo", hex: "#e8c820" },
              { name: "Arancio", hex: "#d4682a" },
            ].map(c => (
              <div key={c.hex} onClick={() => changeBodyColor(c.hex)} title={c.name} style={{
                width: 20, height: 20, borderRadius: "50%", cursor: "pointer", background: c.hex,
                border: `2px solid ${selectedBodyColor === c.hex ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.12)"}`,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.25)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              />
            ))}
            {selectedBodyColor && (
              <div onClick={resetColor} title="Reset" style={{
                width: 20, height: 20, borderRadius: "50%", cursor: "pointer",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.4)",
              }}>↺</div>
            )}
          </div>
        )}
      </div>

      {/* ─── BOTTOM INFO CARDS ─── */}
      <div style={{ flex: "0 0 auto", padding: isMobile ? "0 16px 20px" : "0 36px 28px", background: "transparent", marginTop: -60, position: "relative", zIndex: 15 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 12 : 16 }}>

          {/* INFO card */}
          <div style={{
            background: "rgba(100,130,170,0.12)", border: "1px solid rgba(120,150,190,0.15)",
            borderRadius: 14, padding: isMobile ? "18px 20px" : "22px 26px",
            backdropFilter: "blur(50px) saturate(1.3)", WebkitBackdropFilter: "blur(50px) saturate(1.3)",
            boxShadow: "0 4px 30px rgba(0,10,30,0.4), inset 0 1px 0 rgba(140,170,210,0.06)",
          }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginBottom: 16 }}>INFO</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontSize: 15, color: C.white, fontFamily: mono, fontWeight: 400 }}>{dashVehicle?.plate || "—"}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: mono }}>{dashVehicle?.mileage || "0 km"}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>{dashVehicle?.color || "—"}</div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Eigenaar</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{dashVehicle?.clientName || "—"}</div>
            </div>
          </div>

          {/* VANDAAG card */}
          <div style={{
            background: "rgba(100,130,170,0.12)", border: "1px solid rgba(120,150,190,0.15)",
            borderRadius: 14, padding: isMobile ? "18px 20px" : "22px 26px",
            backdropFilter: "blur(50px) saturate(1.3)", WebkitBackdropFilter: "blur(50px) saturate(1.3)",
            boxShadow: "0 4px 30px rgba(0,10,30,0.4), inset 0 1px 0 rgba(140,170,210,0.06)",
          }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginBottom: 16 }}>VANDAAG</div>
            {dbServices.filter(s => s.status === "in-progress" || s.status === "scheduled").slice(0, 2).map(s => {
              const sv = getVehicle(s.vehicle_id);
              return (
                <Hov key={s.id} onClick={() => setSelectedService(s)} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: C.white, fontWeight: 400 }}>{s.type}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sv?.make} {sv?.name}</div>
                </Hov>
              );
            })}
            {dbServices.filter(s => s.status === "in-progress" || s.status === "scheduled").length === 0 && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", padding: "12px 0" }}>Geen geplande services</div>
            )}
            <div onClick={() => setNewServiceOpen(true)} style={{
              marginTop: 10, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em",
              cursor: "pointer", textAlign: "center", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >+ AFSPRAAK PLANNEN</div>
          </div>

          {/* PLANNING card */}
          <div style={{
            background: "rgba(100,130,170,0.12)", border: "1px solid rgba(120,150,190,0.15)",
            borderRadius: 14, padding: isMobile ? "18px 20px" : "22px 26px",
            backdropFilter: "blur(50px) saturate(1.3)", WebkitBackdropFilter: "blur(50px) saturate(1.3)",
            boxShadow: "0 4px 30px rgba(0,10,30,0.4), inset 0 1px 0 rgba(140,170,210,0.06)",
          }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginBottom: 16 }}>PLANNING</div>
            {[
              { day: "6", month: "Juni", desc: "Hasselt Élégance — GT Tour" },
              { day: "14", month: "Augustus", desc: "Vakantie Malediven" },
              { day: "22", month: "September", desc: "Jaarlijkse inspectie" },
            ].map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{ fontSize: 28, color: "rgba(255,255,255,0.15)", fontWeight: 300, fontFamily: mono, lineHeight: 1, minWidth: 36, textAlign: "right" }}>{ev.day}</div>
                <div>
                  <div style={{ fontSize: 14, color: C.white, fontWeight: 400 }}>{ev.month}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══ CLIENTS ═══ */
  const renderClients = () => (
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>KLANTEN ({dbClients.length})</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: isMobile ? "100%" : 260 }}><SearchBar value={search} onChange={setSearch} placeholder="Zoek klant..." /></div>
          <Btn primary small>+ NIEUWE KLANT</Btn>
        </div>
      </div>
      <Panel style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 700 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", padding: "12px 20px", borderBottom: `1px solid ${C.panelBorder}`, fontSize: 9, letterSpacing: "0.2em", color: C.textDark }}>
          <span>KLANT</span><span>TIER</span><span>WAGENS</span><span>MAANDBEDRAG</span><span>TOTAAL BESTEED</span><span>STATUS</span>
        </div>
        {dbClients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())).map(c => (
          <Hov key={c.id} onClick={() => setSelectedClient(c)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.goldSubtle, border: `1px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 600, fontFamily: mono, flexShrink: 0 }}>{c.avatar || c.name?.[0] || "?"}</div>
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 400 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: C.textDark, marginTop: 1 }}>{c.company}</div>
              </div>
            </div>
            <TierBadge tier={c.tier} />
            <span style={{ fontSize: 13, color: C.text, fontFamily: mono }}>{c.vehicles?.length ?? 0}</span>
            <span style={{ fontSize: 13, color: C.gold, fontFamily: mono }}>€{(c.monthly_fee ?? 0).toLocaleString()}</span>
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: mono }}>{fmtEuro(c.total_spent ?? 0)}</span>
            <StatusBadge status={c.status} />
          </Hov>
        ))}
        </div>
      </Panel>
    </div>
  );

  /* ═══ FLEET ═══ */
  const renderFleet = () => (
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
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
                        display_mode: dbV?.display_mode || "3d",
                        image_path: dbV?.image_path || "",
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
    const filtered = dbServices.filter(s => serviceFilter === "all" || s.status === serviceFilter);
    return (
      <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
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
            const v = getVehicle(s.vehicle_id);
            const cl = getClient(s.client_id);
            const vName = v ? `${v.make} ${v.name}` : `${s.vehicles?.models?.brands?.name || ""} ${s.vehicles?.models?.name || ""}`.trim() || "—";
            return (
              <Hov key={s.id} onClick={() => setSelectedService(s)} style={{ display: "grid", gridTemplateColumns: "0.3fr 1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr", padding: "14px 20px", borderBottom: `1px solid ${C.panelBorder}10`, alignItems: "center" }}>
                <PriorityDot p={s.priority} />
                <div><div style={{ fontSize: 12, color: C.text }}>{s.type}</div><div style={{ fontSize: 10, color: C.textDark, marginTop: 2 }}>{s.date}</div></div>
                <div style={{ fontSize: 12, color: C.text }}>{vName}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{(cl?.name || s.clients?.name || "—").split(" ").slice(0, 2).join(" ")}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: mono }}>{s.technician || "—"}</div>
                <div style={{ fontSize: 12, color: C.gold, fontFamily: mono }}>€{(s.estimated_cost ?? 0).toLocaleString()}</div>
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
    const filtered = dbInvoices.filter(inv => invoiceFilter === "all" || inv.status === invoiceFilter);
    const totalPending = dbInvoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + (i.amount ?? 0), 0);
    return (
      <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
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
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500 }}>BERICHTEN</div>
        <Btn primary small onClick={() => setComposeOpen(true)}>+ NIEUW BERICHT</Btn>
      </div>
      <Panel style={{ overflow: "hidden" }}>
        {dbMessages.map(m => (
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
    <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.text, fontWeight: 500, marginBottom: 20 }}>TEAM ({dbTeam.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {dbTeam.map(t => (
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
      <div style={{ padding: isMobile ? 16 : 28, overflowY: "auto", height: "100%" }}>
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
                                  {has3D ? `3D MODEL GEÜPLOAD (.${model.model_3d_path.split(".").pop()})` : "GEEN 3D MODEL"}
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
                              {uploading ? "UPLOADEN..." : has3D ? "3D MODEL VERVANGEN" : "3D MODEL UPLOADEN (.glb .fbx .obj .stl)"}
                              <input
                                type="file"
                                accept=".glb,.gltf,.fbx,.obj,.stl"
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

  // ── MAIN APP ──
  return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, color: C.white, fontFamily: sans, overflow: "hidden", position: "relative", letterSpacing: "0.02em" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;box-sizing:border-box}
        input::placeholder{color:${C.textDark}}
        textarea::placeholder{color:${C.textDark}}
        textarea{resize:vertical}
        select{appearance:auto}
      `}</style>

      {/* Overlay when menu open */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 115, backdropFilter: "blur(4px)" }} />
      )}

      {/* Slide-over menu — all screen sizes */}
      <nav style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 120,
        background: "rgba(14,14,14,0.97)", borderRight: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Menu header */}
        <div style={{ padding: "28px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.white, letterSpacing: "0.05em" }}>raù</span>
          <div onClick={() => setMobileMenuOpen(false)} style={{ cursor: "pointer", color: C.textMuted, fontSize: 18, padding: 4 }}>✕</div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "16px 0", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
          {navItems.map(it => {
            const a = nav === it.id;
            const hasNotif = it.id === "messages" && unreadMessages > 0;
            return (
              <div key={it.id} onClick={() => { setNav(it.id); setSearch(""); setMobileMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "13px 24px",
                color: a ? C.white : C.textMuted, fontSize: 14, fontWeight: a ? 400 : 300,
                cursor: "pointer", transition: "all 0.2s",
                background: a ? "rgba(255,255,255,0.04)" : "transparent",
                borderLeft: a ? `2px solid ${C.accent}` : "2px solid transparent",
              }}
                onMouseEnter={e => { if (!a) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e => { if (!a) e.currentTarget.style.background = a ? "rgba(255,255,255,0.04)" : "transparent"; }}>
                <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0, opacity: 0.5 }}>{it.icon}</span>
                <span style={{ letterSpacing: "0.08em", flex: 1 }}>{it.label}</span>
                {hasNotif && <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 7px", background: C.redBg, color: C.red, borderRadius: 10 }}>{unreadMessages}</span>}
              </div>
            );
          })}
        </div>

        {/* User + uitloggen */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.textMuted, fontWeight: 500, fontFamily: mono, flexShrink: 0 }}>
              {(user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || "Admin"}</div>
              <div style={{ fontSize: 10, color: C.textDark }}>Beheerder</div>
            </div>
          </div>
          <div onClick={onSignOut} style={{
            padding: "7px 14px", fontSize: 10, fontFamily: mono, letterSpacing: "0.15em",
            border: "1px solid rgba(255,255,255,0.06)", color: C.textMuted,
            borderRadius: 4, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >UITLOGGEN</div>
        </div>
      </nav>

      {/* Main — full width */}
      <main style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header bar for non-dashboard pages */}
        {nav !== "dashboard" && (
          <div style={{
            height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: C.bg,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div onClick={() => setMobileMenuOpen(true)} style={{
                width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                  <line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                  <line x1="0" y1="6" x2="16" y2="6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                  <line x1="0" y1="11" x2="16" y2="11" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                </svg>
              </div>
              <span style={{ fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.white }}>raù</span>
              <span style={{ fontSize: 10, letterSpacing: "0.25em", color: C.textMuted, marginLeft: 8 }}>
                {navItems.find(n => n.id === nav)?.label.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{sections[nav]?.()}</div>
      </main>

      {/* ═══ MODALS ═══ */}

      {/* Client detail */}
      <Modal open={!!selectedClient} onClose={() => setSelectedClient(null)} title="KLANT DETAIL" width={640}>
        {selectedClient && <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.goldSubtle, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.gold, fontWeight: 600, fontFamily: mono }}>{selectedClient.avatar || selectedClient.name?.[0] || "?"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, color: C.white, fontWeight: 400 }}>{selectedClient.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{selectedClient.company} · Lid sinds {selectedClient.since || selectedClient.created_at?.split("T")[0] || "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}><TierBadge tier={selectedClient.tier} /><div style={{ marginTop: 6 }}><StatusBadge status={selectedClient.status} /></div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ l: "MAANDBEDRAG", v: `€${(selectedClient.monthly_fee ?? 0).toLocaleString()}` }, { l: "TOTAAL BESTEED", v: fmtEuro(selectedClient.total_spent ?? 0) }, { l: "WAGENS", v: selectedClient.vehicles?.length ?? 0 }].map((d, i) => (
              <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 3 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", color: C.textDark }}>{d.l}</div>
                <div style={{ fontSize: 18, color: C.goldBright, fontFamily: mono, marginTop: 4 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: C.text, fontWeight: 500, marginBottom: 10 }}>WAGENS</div>
          {(selectedClient.vehicles || []).map(v => {
            const vName = `${v.models?.brands?.name || ""} ${v.models?.name || ""}`.trim() || "Onbekend";
            return (
              <div key={v.id} style={{ padding: "12px 16px", background: C.surface, borderRadius: 3, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: C.text }}>{vName}</div>
                  <div style={{ fontSize: 10, color: C.textDark, fontFamily: mono, marginTop: 2 }}>{v.plate} · {v.color} · {v.mileage}</div>
                </div>
                <div style={{ textAlign: "right" }}><StatusBadge status={v.status} /><div style={{ fontSize: 12, color: C.gold, fontFamily: mono, marginTop: 4 }}>{fmtEuro(v.value ?? 0)}</div></div>
              </div>
            );
          })}
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
          const v = getVehicle(selectedService.vehicle_id);
          const cl = getClient(selectedService.client_id);
          const vName = v ? `${v.make} ${v.name}` : `${selectedService.vehicles?.models?.brands?.name || ""} ${selectedService.vehicles?.models?.name || ""}`.trim() || "—";
          return <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge status={selectedService.status} />
              <span style={{ fontSize: 10, fontFamily: mono, padding: "3px 10px", background: selectedService.priority === "high" ? C.redBg : C.surface, color: selectedService.priority === "high" ? C.red : C.textMuted, border: `1px solid ${selectedService.priority === "high" ? C.red + "40" : C.panelBorder}`, borderRadius: 2 }}>
                {(selectedService.priority || "normal").toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 16, color: C.white, marginBottom: 8 }}>{selectedService.type}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>{selectedService.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { l: "WAGEN", v: vName },
                { l: "KLANT", v: cl?.name || selectedService.clients?.name || "—" },
                { l: "TECHNICUS", v: selectedService.technician || "—" },
                { l: "DATUM", v: selectedService.date },
                { l: "GESCHATTE KOST", v: `€${(selectedService.estimated_cost ?? 0).toLocaleString()}` },
                { l: "NUMMERPLAAT", v: v?.plate || selectedService.vehicles?.plate || "—" },
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
              {dbClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
              {dbClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                {dbTeam.filter(t => t.role !== "Client Relations").map(t => <option key={t.id}>{t.name}</option>)}
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

            {/* Display mode */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 8 }}>WEERGAVE IN KLANTPORTAAL</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["3d", "3D MODEL"], ["image", "AFBEELDING"]].map(([val, label]) => (
                  <div key={val} onClick={() => setVehicleForm({ ...vehicleForm, display_mode: val })}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 6, cursor: "pointer", textAlign: "center",
                      fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em", transition: "all 0.15s",
                      background: vehicleForm.display_mode === val ? `rgba(138,154,110,0.12)` : C.surface,
                      border: `1px solid ${vehicleForm.display_mode === val ? C.gold + "60" : C.panelBorder}`,
                      color: vehicleForm.display_mode === val ? C.gold : C.textMuted,
                    }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload — only shown when display_mode === "image" */}
            {vehicleForm.display_mode === "image" && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textDark, marginBottom: 8 }}>VOERTUIGFOTO</div>
                {vehicleForm.image_path && (
                  <div style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden", maxHeight: 160, position: "relative" }}>
                    <img
                      src={supabase.storage.from("3d-models").getPublicUrl(vehicleForm.image_path).data.publicUrl}
                      alt="Voertuig"
                      style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                    />
                    <div onClick={() => setVehicleForm({ ...vehicleForm, image_path: "" })}
                      style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)", color: C.white, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✕</div>
                  </div>
                )}
                <label style={{ display: "block", padding: "12px 16px", background: C.surface,
                  border: `1px dashed ${vehicleImageUploading ? C.gold : C.panelBorder}`, borderRadius: 6,
                  cursor: vehicleImageUploading ? "wait" : "pointer", textAlign: "center",
                  fontSize: 11, color: vehicleImageUploading ? C.gold : C.textMuted, transition: "all 0.2s" }}>
                  {vehicleImageUploading ? "UPLOADEN..." : vehicleForm.image_path ? "ANDERE FOTO KIEZEN" : "FOTO UPLOADEN"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={vehicleImageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const path = await uploadVehicleImage(file);
                      if (path) setVehicleForm(prev => ({ ...prev, image_path: path }));
                    }} />
                </label>
              </div>
            )}

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
