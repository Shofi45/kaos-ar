import { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMsg(error.message);
  };

  return (
    <div className="card">
      <h2>Admin AR Kaos</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit}>Masuk</button>
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}
