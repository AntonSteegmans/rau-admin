import { useState } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#060606", surface: "#111111", panelBorder: "#1e1e1e",
  white: "#e8e8e4", text: "#b0b0a8", textMuted: "#6a6a64", textDark: "#3e3e3a",
  gold: "#8a9a6e", goldSubtle: "rgba(138,154,110,0.08)",
  red: "#c45050", redBg: "rgba(196,80,80,0.06)",
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Outfit', sans-serif";

export default function Login() {
  const [naam, setNaam] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!naam.trim() || !wachtwoord) return;
    setLoading(true);
    setError(null);

    const email = naam.includes("@") ? naam.trim() : `${naam.trim()}@rau.be`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: wachtwoord,
    });

    if (authError) {
      setError("Ongeldige inloggegevens. Probeer opnieuw.");
      setLoading(false);
    }
    // On success: onAuthStateChange in main.jsx fires SIGNED_IN,
    // loads the profile and redirects automatically.
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.02)",
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 8,
    color: C.white,
    fontSize: 14,
    fontFamily: sans,
    outline: "none",
    transition: "border-color 0.2s",
    letterSpacing: "0.02em",
  };

  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: sans,
    }}>
      <form onSubmit={handleLogin} style={{
        width: "100%", maxWidth: 380, padding: "0 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 44,
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          color: C.white,
          letterSpacing: "0.06em",
          marginBottom: 48,
        }}>raù</div>

        {/* Form card */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.015)",
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 16,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.textMuted, textAlign: "center", marginBottom: 4 }}>
            TOEGANG TOT UW PORTAAL
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              background: C.redBg,
              border: `1px solid rgba(196,80,80,0.2)`,
              borderRadius: 6,
              fontSize: 12,
              color: C.red,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* Naam */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 9, letterSpacing: "0.25em", color: C.textDark, fontFamily: mono }}>
              NAAM
            </label>
            <input
              type="text"
              value={naam}
              onChange={e => { setNaam(e.target.value); setError(null); }}
              placeholder="klant of gebruiker@domein.be"
              autoComplete="username"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "rgba(138,154,110,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Wachtwoord */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 9, letterSpacing: "0.25em", color: C.textDark, fontFamily: mono }}>
              WACHTWOORD
            </label>
            <input
              type="password"
              value={wachtwoord}
              onChange={e => { setWachtwoord(e.target.value); setError(null); }}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "rgba(138,154,110,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !naam.trim() || !wachtwoord}
            style={{
              marginTop: 8,
              padding: "14px 24px",
              background: loading || !naam.trim() || !wachtwoord
                ? "rgba(138,154,110,0.15)"
                : "rgba(138,154,110,0.2)",
              border: `1px solid rgba(138,154,110,${loading || !naam.trim() || !wachtwoord ? "0.2" : "0.4"})`,
              borderRadius: 8,
              color: loading || !naam.trim() || !wachtwoord ? C.textMuted : C.gold,
              fontSize: 11,
              fontFamily: mono,
              fontWeight: 500,
              letterSpacing: "0.2em",
              cursor: loading || !naam.trim() || !wachtwoord ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              if (!loading && naam.trim() && wachtwoord) {
                e.currentTarget.style.background = "rgba(138,154,110,0.28)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = loading || !naam.trim() || !wachtwoord
                ? "rgba(138,154,110,0.15)"
                : "rgba(138,154,110,0.2)";
            }}
          >
            {loading ? "INLOGGEN..." : "INLOGGEN"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, fontSize: 10, color: C.textDark, fontFamily: mono, letterSpacing: "0.1em" }}>
          raù — concierge automobile
        </div>
      </form>
    </div>
  );
}
