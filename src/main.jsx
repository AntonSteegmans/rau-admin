import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import Login from "./Login";
import AdminDashboard from "./RauAdmin";
import ClientPortal from "./RauClient";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (user) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role, client_id")
        .eq("id", user.id)
        .single();
      setSession(user);
      setRole(data?.role ?? "client");
      setClientId(data?.client_id ?? null);
    } catch (err) {
      console.error("Profiel laden mislukt:", err);
      setSession(user);
      setRole("client");
      setClientId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Supabase v2: calling supabase.from() directly inside onAuthStateChange
    // can deadlock. Defer loadProfile with setTimeout to escape the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setTimeout(() => loadProfile(session.user), 0);
        } else {
          setSession(null);
          setRole(null);
          setClientId(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div style={{ background: "#0a0a0a", height: "100vh", width: "100%" }} />
  );

  if (!session) return <Login />;

  if (role === "admin") return (
    <AdminDashboard user={session} onSignOut={handleSignOut} />
  );

  return (
    <ClientPortal user={session} clientId={clientId} onSignOut={handleSignOut} />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
