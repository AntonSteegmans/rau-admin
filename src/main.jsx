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
    const { data } = await supabase
      .from("profiles")
      .select("role, client_id")
      .eq("id", user.id)
      .single();
    setSession(user);
    setRole(data?.role ?? "client");
    setClientId(data?.client_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately with the current
    // session (or null), so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED — always reload profile
          await loadProfile(session.user);
        } else {
          // SIGNED_OUT or no session on first load
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
