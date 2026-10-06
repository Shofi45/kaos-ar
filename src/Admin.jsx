import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import "./styles/admin.css";

export default function Admin() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (supabase && session) {
    return (
      <div className="admin">
        <Dashboard user={session.user} />
      </div>
    );
  }

  let body = <Login />;
  if (!supabase) {
    body = (
      <p>
        Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan
        VITE_SUPABASE_ANON_KEY.
      </p>
    );
  } else if (session === undefined) {
    body = <p>Memuat...</p>;
  }

  return (
    <div className="admin">
      <div className="adm-login">{body}</div>
    </div>
  );
}
