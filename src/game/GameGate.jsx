import { Suspense, lazy, useEffect, useState } from "react";
import { supabase } from "../supabase";
import { clearCode, getDeviceId, getSavedCode, saveCode } from "./device";
import { enterLandscape, exitLandscape } from "./screen";

const Game = lazy(() => import("./Game"));

const MESSAGES = {
  invalid: "Kode tidak ditemukan atau sudah dinonaktifkan.",
  wrong_design: "Kode ini untuk desain kaos yang lain.",
  full: "Kode ini sudah dipakai di jumlah perangkat maksimal.",
};

export default function GameGate({ design, onClose }) {
  const [phase, setPhase] = useState("check");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const redeem = async (value) => {
    if (!supabase) throw new Error("Server belum dikonfigurasi.");
    const { data, error } = await supabase.rpc("redeem_game_code", {
      p_code: value,
      p_device: getDeviceId(),
      p_slug: design.slug,
    });
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    const saved = getSavedCode(design.slug);
    if (!saved) {
      setPhase("ask");
      return;
    }
    // masuk landscape selagi masih dalam ketukan "Mainkan game"
    enterLandscape();
    let alive = true;
    redeem(saved)
      .then((r) => {
        if (!alive) return;
        if (r === "ok") {
          setPhase("play");
        } else {
          clearCode(design.slug);
          exitLandscape();
          setPhase("ask");
        }
      })
      .catch(() => {
        if (!alive) return;
        exitLandscape();
        setPhase("ask");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const v = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (v.length < 6) return setMsg("Masukkan kode dari kartu pembelian.");
    setBusy(true);
    setMsg("");
    // harus dipanggil langsung di dalam ketukan tombol
    enterLandscape();
    try {
      const r = await redeem(v);
      if (r === "ok") {
        saveCode(design.slug, v);
        setPhase("play");
      } else {
        exitLandscape();
        setMsg(MESSAGES[r] || MESSAGES.invalid);
      }
    } catch {
      exitLandscape();
      setMsg("Tidak bisa memeriksa kode. Cek koneksi internet lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    exitLandscape();
    onClose();
  };

  if (phase === "play") {
    return (
      <Suspense fallback={<div className="gate">Memuat game...</div>}>
        <Game design={design} onClose={cancel} />
      </Suspense>
    );
  }

  if (phase === "check") {
    return <div className="gate">Memeriksa kode...</div>;
  }

  return (
    <div className="gate" onClick={cancel}>
      <div className="gate-card" onClick={(e) => e.stopPropagation()}>
        <h2>Masukkan kode game</h2>
        <p>Kode ada di kartu pembelian yang kamu dapat bersama kaosmu.</p>
        <input
          type="text"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {msg && <p className="gate-err">{msg}</p>}
        <button className="pbtn" onClick={submit} disabled={busy}>
          {busy ? "Memeriksa..." : "Mulai main"}
        </button>
        <button className="pbtn alt" onClick={cancel}>
          Batal
        </button>
      </div>
    </div>
  );
}
