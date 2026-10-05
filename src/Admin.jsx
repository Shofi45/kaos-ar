import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";

export default function Admin() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <div className="admin">
        <p>
          Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan
          VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  if (session === undefined) {
    return (
      <div className="admin">
        <p>Memuat...</p>
      </div>
    );
  }

  return <div className="admin">{session ? <Dashboard /> : <Login />}</div>;
}
