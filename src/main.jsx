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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSession(null);
        setRole(null);
        setClientId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user, userRole, userClientId) => {
    setSession(user);
    setRole(userRole);
    setClientId(userClientId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div style={{ background: "#0a0a0a", height: "100vh", width: "100%" }} />
  );

  if (!session) return <Login onLogin={handleLogin} />;

  if (role === "admin") return (
    <AdminDashboard user={session} onSignOut={handleSignOut} />
  );

  return (
    <ClientPortal user={session} clientId={clientId} onSignOut={handleSignOut} />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
