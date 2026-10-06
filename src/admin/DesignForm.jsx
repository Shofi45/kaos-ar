import { useState } from "react";
import { slugOk } from "./constants";
import { saveDesign } from "./api";

export default function DesignForm({ list, onSaved }) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState("");

  const submit = async () => {
    setMsg("");
    const s = slug.trim();
    if (!slugOk(s)) {
      return setMsg(
        "Nama hanya huruf kecil, angka, dan tanda hubung. Contoh: naga-merah",
      );
    }
    const old = list.find((d) => d.slug === s);
    if (!old && (!imageFile || !videoFile)) {
      return setMsg(
        "Desain baru butuh gambar desain (PNG/JPG) dan video (.mp4).",
      );
    }
    if (imageFile && !/\.(png|jpe?g)$/i.test(imageFile.name)) {
      return setMsg("Gambar harus berformat PNG atau JPG");
    }
    if (videoFile && !videoFile.name.toLowerCase().endsWith(".mp4")) {
      return setMsg("Video harus berformat .mp4");
    }
    if (videoFile && videoFile.size > 5 * 1024 * 1024) {
      if (
        !window.confirm(
          "Video lebih dari 5 MB. Ini boros kuota tiap scan. Lanjut?",
        )
      )
        return;
    }

    setBusy(true);
    try {
      setProgress("Mengunggah...");
      await saveDesign({
        slug: s,
        title,
        imageFile,
        videoFile,
        old,
        onProgress: (p) => setProgress(`Memproses gambar ${p}%`),
      });
      setMsg(`Tersimpan: ${s}`);
      setSlug("");
      setTitle("");
      setImageFile(null);
      setVideoFile(null);
      setFileKey((k) => k + 1);
      onSaved();
    } catch (e) {
      setMsg(e.message || String(e));
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="card">
      <h3>Tambah / ganti desain</h3>
      <input
        placeholder="Nama desain, contoh: naga-merah"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      <input
        placeholder="Judul (opsional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label>
        Gambar desain (PNG/JPG)
        <input
          key={"t" + fileKey}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />
      </label>
      <label>
        Video (.mp4, disarankan di bawah 3 MB)
        <input
          key={"v" + fileKey}
          type="file"
          accept="video/mp4"
          onChange={(e) => setVideoFile(e.target.files[0] || null)}
        />
      </label>
      <button disabled={busy} onClick={submit}>
        {busy ? progress || "Mengunggah..." : "Simpan"}
      </button>
      {msg && <p className="err">{msg}</p>}
      <p className="hint">
        Nama yang sudah ada = ganti file (boleh hanya salah satu). Semua desain
        dipakai lewat satu link yang sama.
      </p>
    </div>
  );
}
