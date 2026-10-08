import { useCallback, useEffect, useState } from "react";
import {
  fetchGallery,
  removeGallery,
  saveGalleryItem,
  toggleGallery,
} from "./api";

function GalleryForm({ editing, onSaved, onCancel }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("");
    if (!editing && !file) return setMsg("Gambar baru butuh file foto.");
    if (file && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      return setMsg("Gambar harus PNG, JPG, atau WEBP.");
    }
    if (file && file.size > 3 * 1024 * 1024) {
      if (!window.confirm("Gambar lebih dari 3 MB. Lanjut?")) return;
    }
    setBusy(true);
    try {
      await saveGalleryItem({
        old: editing,
        title: title.trim(),
        imageFile: file,
      });
      onSaved();
    } catch (e) {
      setMsg(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>{editing ? "Ubah gambar" : "Tambah gambar"}</h3>
      <input
        placeholder="Judul / keterangan (opsional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label>
        Gambar {editing && "(kosongkan jika tidak diganti)"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
      </label>
      <button disabled={busy} onClick={submit}>
        {busy ? "Menyimpan..." : "Simpan gambar"}
      </button>
      {editing && (
        <button className="small ghost" onClick={onCancel}>
          Batal ubah
        </button>
      )}
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}

export default function GalleryTab({ onError }) {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await fetchGallery();
    if (error) onError(error.message);
    else setList(data);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const done = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    load();
  };

  const onEdit = (g) => {
    setEditing(g);
    setFormKey((k) => k + 1);
    document.querySelector(".adm-content")?.scrollTo({ top: 0 });
  };

  const onToggle = async (g) => {
    const { error } = await toggleGallery(g);
    if (error) onError(error.message);
    load();
  };

  const onRemove = async (g) => {
    if (!window.confirm("Hapus gambar ini?")) return;
    const { error } = await removeGallery(g);
    if (error) onError(error.message);
    load();
  };

  return (
    <div className="adm-split">
      <GalleryForm
        key={formKey}
        editing={editing}
        onSaved={done}
        onCancel={done}
      />
      <div className="adm-list">
        {list.map((g) => (
          <div className="card" key={g.id}>
            <img
              className="adm-thumb"
              src={g.image_url}
              alt=""
              loading="lazy"
            />
            <div className="row">
              <strong>{g.title || "Tanpa judul"}</strong>
              <span className={g.active ? "on" : "off"}>
                {g.active ? "aktif" : "nonaktif"}
              </span>
            </div>
            <div className="row">
              <button className="small" onClick={() => onEdit(g)}>
                Ubah
              </button>
              <button className="small" onClick={() => onToggle(g)}>
                {g.active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button className="small danger" onClick={() => onRemove(g)}>
                Hapus
              </button>
            </div>
          </div>
        ))}
        {!list.length && <p className="hint">Belum ada gambar.</p>}
      </div>
    </div>
  );
}
