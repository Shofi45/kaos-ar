import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const makeCode = () => {
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
};

const show = (c) => `${c.slice(0, 4)}-${c.slice(4)}`;

export default function CodesTab({ designs, onError }) {
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState("10");
  const [slug, setSlug] = useState("");
  const [maxDev, setMaxDev] = useState("2");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const formRef = useRef(null);

  const say = (text, ok = true) => setMsg({ ok, text });
  const nameOf = (s) =>
    s ? designs.find((d) => d.slug === s)?.title || s : "Semua desain";

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      onError(error.message);
      setLoading(false);
      return;
    }
    const r = await supabase.from("game_redemptions").select("code");
    const m = {};
    (r.data || []).forEach((x) => {
      m[x.code] = (m[x.code] || 0) + 1;
    });
    setList(data || []);
    setCounts(m);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setQty("10");
    setSlug("");
    setMaxDev("2");
    setNote("");
  };

  const submit = async () => {
    const md = Math.floor(Number(maxDev));
    if (!(md >= 1 && md <= 5)) {
      return say("Maksimal perangkat harus 1 sampai 5.", false);
    }
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("game_codes")
          .update({
            design_slug: slug || null,
            max_devices: md,
            note: note.trim(),
          })
          .eq("code", editing.code);
        if (error) throw error;
        say("Perubahan tersimpan.");
        reset();
      } else {
        const n = Math.floor(Number(qty));
        if (!(n >= 1 && n <= 200)) {
          setBusy(false);
          return say("Jumlah kode harus 1 sampai 200.", false);
        }
        const seen = new Set();
        const rows = [];
        while (rows.length < n) {
          const c = makeCode();
          if (seen.has(c)) continue;
          seen.add(c);
          rows.push({
            code: c,
            design_slug: slug || null,
            max_devices: md,
            note: note.trim(),
          });
        }
        const { error } = await supabase.from("game_codes").insert(rows);
        if (error) throw error;
        say(`${n} kode dibuat.`);
      }
      await load();
    } catch (e) {
      say(e?.message || "Gagal menyimpan.", false);
    } finally {
      setBusy(false);
    }
  };

  const edit = (c) => {
    setEditing(c);
    setSlug(c.design_slug || "");
    setMaxDev(String(c.max_devices));
    setNote(c.note || "");
    say("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggle = async (c) => {
    const { error } = await supabase
      .from("game_codes")
      .update({ active: !c.active })
      .eq("code", c.code);
    if (error) onError(error.message);
    load();
  };

  const resetDevices = async (c) => {
    if (
      !window.confirm(
        `Reset perangkat untuk kode ${show(c.code)}? Pembeli bisa memakainya lagi di perangkat baru.`,
      )
    )
      return;
    const { error } = await supabase
      .from("game_redemptions")
      .delete()
      .eq("code", c.code);
    if (error) onError(error.message);
    load();
  };

  const remove = async (c) => {
    if (
      !window.confirm(
        `Hapus kode ${show(c.code)}? Kartu yang memuatnya tidak akan berlaku lagi.`,
      )
    )
      return;
    const { error } = await supabase
      .from("game_codes")
      .delete()
      .eq("code", c.code);
    if (error) onError(error.message);
    if (editing?.code === c.code) reset();
    load();
  };

  const shown = list.filter((c) => !filter || (c.design_slug || "") === filter);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(
        shown.map((c) => show(c.code)).join("\n"),
      );
      say(`${shown.length} kode disalin.`);
    } catch {
      say("Tidak bisa menyalin. Pakai Unduh CSV.", false);
    }
  };

  const downloadCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["kode,desain,catatan"].concat(
      shown.map((c) =>
        [show(c.code), nameOf(c.design_slug), c.note].map(esc).join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kode-game.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="ct">
      <div className="adm-split">
        <div className="ct-left" ref={formRef}>
          <div className="card">
            <h3>{editing ? `Ubah kode ${show(editing.code)}` : "Buat kode"}</h3>
            {!editing && (
              <label>
                Jumlah kode
                <input
                  type="text"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </label>
            )}
            <label>
              Berlaku untuk desain
              <select value={slug} onChange={(e) => setSlug(e.target.value)}>
                <option value="">Semua desain</option>
                {designs.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.title || d.slug}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Maksimal perangkat per kode
              <input
                type="text"
                inputMode="numeric"
                value={maxDev}
                onChange={(e) => setMaxDev(e.target.value)}
              />
              <small className="hint">
                Mencegah satu kode dibagikan ke banyak orang. Disarankan 2.
              </small>
            </label>
            <label>
              Catatan (opsional)
              <input
                type="text"
                placeholder="Contoh: batch Oktober"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button onClick={submit} disabled={busy}>
              {busy
                ? "Menyimpan..."
                : editing
                  ? "Simpan perubahan"
                  : "Buat kode"}
            </button>
            {editing && (
              <button className="small ghost" onClick={reset}>
                Batal ubah
              </button>
            )}
            {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
            <p className="hint">
              Cetak kodenya di kartu pembelian. Kode dicek di server, jadi tidak
              bisa dibaca dari kode situs.
            </p>
          </div>
        </div>

        <div className="ct-stack">
          <div className="row">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Semua kode</option>
              {designs.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.title || d.slug}
                </option>
              ))}
            </select>
            <button
              className="small"
              onClick={copyAll}
              disabled={!shown.length}
            >
              Salin semua
            </button>
            <button
              className="small"
              onClick={downloadCsv}
              disabled={!shown.length}
            >
              Unduh CSV
            </button>
          </div>

          {loading && <p className="hint">Memuat...</p>}
          {!loading && !shown.length && <p className="hint">Belum ada kode.</p>}

          {shown.map((c) => (
            <div
              className={
                editing?.code === c.code
                  ? "card ct-item editing"
                  : "card ct-item"
              }
              key={c.code}
            >
              <div className="ct-item-main">
                <div>
                  <strong className="code-text">{show(c.code)}</strong>
                  <span className="ct-chip">{nameOf(c.design_slug)}</span>{" "}
                  <span className="ct-chip">
                    {counts[c.code] || 0}/{c.max_devices} perangkat
                  </span>{" "}
                  <span className={c.active ? "on" : "off"}>
                    {c.active ? "aktif" : "nonaktif"}
                  </span>
                  {c.note && <p>{c.note}</p>}
                </div>
              </div>
              <div className="ct-actions">
                <button
                  className="small"
                  onClick={() => navigator.clipboard.writeText(show(c.code))}
                >
                  Salin
                </button>
                <button className="small" onClick={() => edit(c)}>
                  Ubah
                </button>
                <button
                  className="small"
                  onClick={() => resetDevices(c)}
                  disabled={!counts[c.code]}
                >
                  Reset perangkat
                </button>
                <button className="small" onClick={() => toggle(c)}>
                  {c.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button className="small danger" onClick={() => remove(c)}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
