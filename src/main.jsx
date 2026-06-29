import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import AdminDashboard from "./RauAdmin";
import ClientPortal from "./RauClient";
import { resetDemo } from "./demo/store";
import { isLiveEnabled, setLiveEnabled, getApiKey, setApiKey } from "./demo/aiValuation.js";
import { getTheme, setTheme as persistTheme, DARK, LIGHT } from "./demo/theme";

const ROLE_KEY = "rau-demo-role";

function AiPanel({ onClose }) {
  const [live, setLive] = useState(isLiveEnabled());
  const [key, setKey]   = useState(getApiKey());

  const save = () => {
    setLiveEnabled(live);
    setApiKey(key.trim());
    onClose();
  };

  const mono = "'JetBrains Mono', monospace";
  const C = { gold:"#8a9a6e", goldBright:"#a0b27e", goldSubtle:"rgba(138,154,110,0.08)", goldDim:"rgba(138,154,110,0.35)", text:"#b0b0a8", textMuted:"#6a6a64", textDark:"#3e3e3a", surface:"#161616", green:"#7a9e6a", red:"#c45050" };

  return (
    <div style={{ position:"absolute", top:44, right:0, width:280, background:"rgba(12,12,12,0.97)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"16px", zIndex:10000, backdropFilter:"blur(12px)", boxShadow:"0 16px 48px rgba(0,0,0,0.7)" }}>
      <div style={{ fontSize:9, letterSpacing:"0.25em", color:C.textDark, fontFamily:mono, marginBottom:12 }}>AI-WAARDERING INSTELLINGEN</div>

      {/* Toggle */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:11, color:C.text, fontFamily:mono }}>Live Claude API</span>
        <div onClick={() => setLive(l => !l)} style={{ width:36, height:20, borderRadius:10, background: live ? C.goldSubtle : "rgba(255,255,255,0.06)", border:`1px solid ${live ? C.goldDim : "rgba(255,255,255,0.1)"}`, position:"relative", cursor:"pointer", transition:"all 0.2s" }}>
          <div style={{ position:"absolute", top:3, left: live ? 17 : 3, width:14, height:14, borderRadius:"50%", background: live ? C.goldBright : "#444", transition:"left 0.2s" }} />
        </div>
      </div>

      {/* API key */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:8, letterSpacing:"0.2em", color:C.textDark, fontFamily:mono, marginBottom:5 }}>ANTHROPIC API KEY</div>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ width:"100%", padding:"8px 10px", fontSize:10, fontFamily:mono, background:C.surface, border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, color:C.text, outline:"none" }}
        />
        <div style={{ fontSize:8, color:C.textDark, fontFamily:mono, marginTop:4, lineHeight:1.5 }}>
          Sleutel wordt lokaal opgeslagen.<br/>Default: offline simulatie.
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={save} style={{ flex:1, padding:"7px 0", fontSize:9, fontFamily:mono, letterSpacing:"0.12em", background:C.goldSubtle, border:`1px solid ${C.goldDim}`, color:C.goldBright, borderRadius:5, cursor:"pointer" }}>
          OPSLAAN
        </button>
        <button onClick={onClose} style={{ flex:1, padding:"7px 0", fontSize:9, fontFamily:mono, letterSpacing:"0.12em", background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:C.textMuted, borderRadius:5, cursor:"pointer" }}>
          ANNULEREN
        </button>
      </div>
    </div>
  );
}

function DemoBar({ role, setRole, theme, setTheme }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [liveActive, setLiveActive] = useState(isLiveEnabled());

  const btn = (active) => ({
    padding: "5px 12px", fontSize: 10, letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace",
    border: "1px solid " + (active ? "#8a9a6e" : "rgba(255,255,255,0.12)"),
    background: active ? "rgba(138,154,110,0.12)" : "transparent",
    color: active ? "#a0b27e" : "#6a6a64", borderRadius: 6, cursor: "pointer",
  });

  const handleAiClose = () => {
    setAiOpen(false);
    setLiveActive(isLiveEnabled()); // re-read after save
  };

  return (
    <div style={{ position: "fixed", top: 10, right: 12, zIndex: 9999, display: "flex", gap: 6, alignItems: "center",
      background: "rgba(8,8,8,0.85)", padding: "6px 8px", borderRadius: 10, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#3e3e3a", fontFamily: "'JetBrains Mono', monospace", marginRight: 2 }}>DEMO</span>
      <button style={btn(role === "admin")} onClick={() => setRole("admin")}>ADMIN</button>
      <button style={btn(role === "client")} onClick={() => setRole("client")}>MAARTEN</button>
      <button style={btn(false)} onClick={() => { if (confirm("Demodata terugzetten?")) { resetDemo(); location.reload(); } }}>RESET</button>
      {/* AI-instellingen */}
      <div style={{ position:"relative" }}>
        <button
          style={{ ...btn(liveActive), padding:"5px 10px", border:`1px solid ${liveActive ? "#8a9a6e" : "rgba(255,255,255,0.12)"}` }}
          onClick={() => setAiOpen(o => !o)}
          title="AI-waardeschatting instellingen"
        >
          AI{liveActive ? " ●" : ""}
        </button>
        {aiOpen && <AiPanel onClose={handleAiClose} />}
      </div>
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title={theme === "light" ? "Donker thema" : "Licht thema"}
        style={{ ...btn(false), padding: "5px 8px", fontSize: 13, lineHeight: 1, border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) || "admin");
  useEffect(() => { localStorage.setItem(ROLE_KEY, role); }, [role]);

  const [theme, setThemeState] = useState(() => getTheme());
  const handleSetTheme = (t) => { persistTheme(t); setThemeState(t); };
  // Body-achtergrond meeschakelen zodat er geen donkere strook onder de content valt.
  useEffect(() => {
    const bg = (theme === "light" ? LIGHT : DARK).bg;
    document.body.style.background = bg;
    document.documentElement.style.background = bg;
  }, [theme]);

  const demoUser = { id: "demo-user", email: "demo@rau.be" };
  const signOut = () => setRole(role === "admin" ? "client" : "admin");

  return (
    <>
      <DemoBar role={role} setRole={setRole} theme={theme} setTheme={handleSetTheme} />
      {role === "admin"
        ? <AdminDashboard user={demoUser} onSignOut={signOut} theme={theme} setTheme={handleSetTheme} />
        : <ClientPortal user={demoUser} clientId="c-maarten" onSignOut={signOut} theme={theme} setTheme={handleSetTheme} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
