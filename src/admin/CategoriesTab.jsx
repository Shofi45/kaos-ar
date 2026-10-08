import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { fetchContent, saveContent } from "../content";

const KEY = "kategori";

export default function CategoriesTab({ onError }) {
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({});
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const formRef = useRef(null);

  const say = (text, ok = true) => setMsg({ ok, text });

  const load = useCallback(async () => {
    const c = await fetchContent(KEY, true);
    setList(c.list || []);
    const { data, error } = await supabase.from("products").select("category");
    if (error) {
      onError(error.message);
    } else {
      const m = {};
      (data || []).forEach((p) => {
        if (p.category) m[p.category] = (m[p.category] || 0) + 1;
      });
      setCounts(m);
    }
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next) => {
    await saveContent(KEY, { list: next });
    setList(next);
  };

  const reset = () => {
    setName("");
    setEditing(null);
  };

  const submit = async () => {
    const v = name.trim();
    if (!v) return say("Nama kategori wajib diisi.", false);
    if (v.length > 30) return say("Nama kategori maksimal 30 karakter.", false);
    const dup = list.some(
      (x, i) => i !== editing && x.toLowerCase() === v.toLowerCase(),
    );
    if (dup) return say("Kategori itu sudah ada.", false);

    setBusy(true);
    try {
      if (editing === null) {
        await persist([...list, v]);
        say("Kategori ditambahkan.");
      } else {
        const old = list[editing];
        await persist(list.map((x, i) => (i === editing ? v : x)));
        if (old !== v) {
          const { error } = await supabase
            .from("products")
            .update({ category: v })
            .eq("category", old);
          if (error) throw error;
        }
        say(
          old !== v && counts[old]
            ? `Diubah. ${counts[old]} produk ikut diperbarui.`
            : "Perubahan tersimpan.",
        );
      }
      reset();
      await load();
    } catch (e) {
      say(e?.message || "Gagal menyimpan.", false);
    } finally {
      setBusy(false);
    }
  };

  const edit = (i) => {
    setEditing(i);
    setName(list[i]);
    say("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const move = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await persist(next);
      if (editing === i) setEditing(j);
      else if (editing === j) setEditing(i);
    } catch (e) {
      say(e?.message || "Gagal menyimpan.", false);
    }
  };

  const remove = async (i) => {
    const n = list[i];
    const used = counts[n] || 0;
    if (used) {
      return say(
        `"${n}" dipakai ${used} produk. Pindahkan produknya ke kategori lain dulu.`,
        false,
      );
    }
    if (!window.confirm(`Hapus kategori "${n}"?`)) return;
    try {
      await persist(list.filter((_, k) => k !== i));
      if (editing === i) reset();
      else if (editing !== null && editing > i) setEditing(editing - 1);
      say("Kategori dihapus.");
    } catch (e) {
      say(e?.message || "Gagal menghapus.", false);
    }
  };

  const orphan = Object.keys(counts).filter((c) => !list.includes(c));

  const adopt = async () => {
    try {
      await persist([...list, ...orphan]);
      say("Kategori dari produk sudah didaftarkan.");
    } catch (e) {
      say(e?.message || "Gagal menyimpan.", false);
    }
  };

  return (
    <div className="ct">
      <div className="adm-split">
        <div className="ct-left" ref={formRef}>
          <div className="card">
            <h3>{editing === null ? "Tambah kategori" : "Ubah kategori"}</h3>
            <label>
              Nama kategori
              <input
                type="text"
                placeholder="Contoh: Apparel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </label>
            <button onClick={submit} disabled={busy}>
              {busy
                ? "Menyimpan..."
                : editing === null
                  ? "Tambah kategori"
                  : "Simpan perubahan"}
            </button>
            {editing !== null && (
              <button className="small ghost" onClick={reset}>
                Batal ubah
              </button>
            )}
            {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
            <p className="hint">
              Kategori dipilih saat menambah atau mengubah produk. Kalau nama
              diubah, produk yang memakainya ikut berubah.
            </p>
          </div>

          {orphan.length > 0 && (
            <div className="card">
              <h3>Belum terdaftar</h3>
              <p className="hint">
                Produk berikut memakai kategori yang belum ada di daftar:{" "}
                {orphan.join(", ")}.
              </p>
              <button className="small" onClick={adopt}>
                Daftarkan semuanya
              </button>
            </div>
          )}
        </div>

        <div className="ct-stack">
          {loading && <p className="hint">Memuat...</p>}
          {!loading && !list.length && (
            <p className="hint">Belum ada kategori.</p>
          )}
          {list.map((n, i) => (
            <div
              className={editing === i ? "card ct-item editing" : "card ct-item"}
              key={n}
            >
              <div className="ct-item-main">
                <span className="ct-num">{i + 1}</span>
                <div>
                  <strong>{n}</strong>
                  <span className="ct-chip">{counts[n] || 0} produk</span>
                </div>
              </div>
              <div className="ct-actions">
                <button className="small" onClick={() => edit(i)}>
                  Ubah
                </button>
                <button
                  className="small ghost"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Naikkan"
                >
                  ↑
                </button>
                <button
                  className="small ghost"
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Turunkan"
                >
                  ↓
                </button>
                <button className="small danger" onClick={() => remove(i)}>
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