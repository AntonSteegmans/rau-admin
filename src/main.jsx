import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import AdminDashboard from "./RauAdmin";
import ClientPortal from "./RauClient";
import { resetDemo } from "./demo/store";

const ROLE_KEY = "rau-demo-role";

function DemoBar({ role, setRole }) {
  const btn = (active) => ({
    padding: "5px 12px", fontSize: 10, letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace",
    border: "1px solid " + (active ? "#8a9a6e" : "rgba(255,255,255,0.12)"),
    background: active ? "rgba(138,154,110,0.12)" : "transparent",
    color: active ? "#a0b27e" : "#6a6a64", borderRadius: 6, cursor: "pointer",
  });
  return (
    <div style={{ position: "fixed", top: 10, right: 12, zIndex: 9999, display: "flex", gap: 6, alignItems: "center",
      background: "rgba(8,8,8,0.85)", padding: "6px 8px", borderRadius: 10, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#3e3e3a", fontFamily: "'JetBrains Mono', monospace", marginRight: 2 }}>DEMO</span>
      <button style={btn(role === "admin")} onClick={() => setRole("admin")}>ADMIN</button>
      <button style={btn(role === "client")} onClick={() => setRole("client")}>MAARTEN</button>
      <button style={btn(false)} onClick={() => { if (confirm("Demodata terugzetten?")) { resetDemo(); location.reload(); } }}>RESET</button>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) || "admin");
  useEffect(() => { localStorage.setItem(ROLE_KEY, role); }, [role]);

  const demoUser = { id: "demo-user", email: "demo@rau.be" };
  const signOut = () => setRole(role === "admin" ? "client" : "admin");

  return (
    <>
      <DemoBar role={role} setRole={setRole} />
      {role === "admin"
        ? <AdminDashboard user={demoUser} onSignOut={signOut} />
        : <ClientPortal user={demoUser} clientId="c-maarten" onSignOut={signOut} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
