import { useState } from "react";
import QRCode from "qrcode";
import { POWER_OPTIONS } from "../game/engine";
import {
  designLink,
  localLink,
  parseYouTube,
  removeDesign,
  saveDesign,
  slugOk,
  toggleDesign,
  visible,
} from "./api";

const ytLink = (id) => (id ? `https://www.youtube.com/watch?v=${id}` : "");

function DesignForm({ list, editing, onSaved, onCancel }) {
  const [slug, setSlug] = useState(editing?.slug || "");
  const [title, setTitle] = useState(editing?.title || "");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [source, setSource] = useState(editing?.video_source || "upload");
  const [ytUrl, setYtUrl] = useState(ytLink(editing?.youtube_id));
  const [portrait, setPortrait] = useState(Boolean(editing?.youtube_portrait));
  const [fileKey, setFileKey] = useState(0);
  const [gPower, setGPower] = useState(editing?.game?.power || "pedang");
  const [gName, setGName] = useState(editing?.game?.name || "");
  const [gClues, setGClues] = useState((editing?.game?.clues || []).join("\n"));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState("");
  const ytId = parseYouTube(ytUrl);

  const submit = async () => {
    setMsg("");
    const s = slug.trim();
    if (!slugOk(s)) {
      return setMsg(
        "Nama hanya huruf kecil, angka, dan tanda hubung. Contoh: naga-merah",
      );
    }
    const old = editing || list.find((d) => d.slug === s);
    if (!old && !imageFile) {
      return setMsg("Desain baru butuh gambar desain (PNG/JPG).");
    }
    if (imageFile && !/\.(png|jpe?g)$/i.test(imageFile.name)) {
      return setMsg("Gambar harus berformat PNG atau JPG");
    }
    if (source === "youtube") {
      if (!ytId) return setMsg("Link YouTube tidak valid.");
    } else {
      if (!videoFile && !old?.video_url) {
        return setMsg("Unggah video (.mp4) atau pilih sumber Link YouTube.");
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
    }

    setBusy(true);
    try {
      setProgress("Mengunggah...");
      await saveDesign({
        slug: s,
        title,
        imageFile,
        videoFile: source === "upload" ? videoFile : null,
        videoSource: source,
        youtubeUrl: ytUrl,
        youtubePortrait: portrait,
        game: {
          power: gPower,
          name: gName.trim(),
          clues: gClues
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean)
            .slice(0, 10),
        },
        old,
        onProgress: (p) => setProgress(`Memproses gambar ${p}%`),
      });
      onSaved();
      if (editing) {
        onCancel();
      } else {
        setMsg(`Tersimpan: ${s}`);
        setSlug("");
        setTitle("");
        setImageFile(null);
        setVideoFile(null);
        setYtUrl("");
        setPortrait(false);
        setGPower("pedang");
        setGName("");
        setGClues("");
        setFileKey((k) => k + 1);
      }
    } catch (e) {
      setMsg(e.message || String(e));
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="card" id="design-form">
      <h3>{editing ? `Ubah desain: ${editing.slug}` : "Tambah desain"}</h3>
      <input
        placeholder="Nama desain, contoh: naga-merah"
        value={slug}
        disabled={Boolean(editing)}
        onChange={(e) => setSlug(e.target.value)}
      />
      <input
        placeholder="Judul (opsional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {editing?.image_url && (
        <img
          className="adm-thumb"
          src={editing.image_url}
          alt="Gambar saat ini"
        />
      )}
      <label>
        {editing
          ? "Ganti gambar desain (kosongkan untuk tetap memakai yang lama)"
          : "Gambar desain (PNG/JPG)"}
        <input
          key={"t" + fileKey}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />
      </label>
      {editing && imageFile && (
        <p className="hint">
          Gambar baru memicu pembuatan ulang marker, jadi prosesnya lebih lama.
        </p>
      )}

      <div className="row">
        <button
          type="button"
          className={source === "upload" ? "small" : "small ghost"}
          onClick={() => setSource("upload")}
        >
          Unggah video
        </button>
        <button
          type="button"
          className={source === "youtube" ? "small" : "small ghost"}
          onClick={() => setSource("youtube")}
        >
          Link YouTube
        </button>
      </div>
      {source === "upload" ? (
        <label>
          {editing?.video_url
            ? "Ganti video .mp4 (kosongkan untuk tetap memakai yang lama)"
            : "Video (.mp4, disarankan di bawah 3 MB)"}
          <input
            key={"v" + fileKey}
            type="file"
            accept="video/mp4"
            onChange={(e) => setVideoFile(e.target.files[0] || null)}
          />
        </label>
      ) : (
        <label>
          Link video YouTube
          <input
            type="text"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => {
              setYtUrl(e.target.value);
              if (/\/shorts\//.test(e.target.value)) setPortrait(true);
            }}
          />
          {ytUrl.trim() && !ytId && (
            <small className="err">
              Link tidak dikenali sebagai video YouTube.
            </small>
          )}
          {ytId && (
            <span className="row">
              <input
                type="checkbox"
                checked={portrait}
                onChange={(e) => setPortrait(e.target.checked)}
              />
              <span>Video potret (YouTube Shorts)</span>
            </span>
          )}
          {ytId && (
            <img
              className="adm-thumb"
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt="Pratinjau video"
            />
          )}
        </label>
      )}

      <div className="game-settings">
        <strong>Pengaturan game (opsional)</strong>
        <label>
          Nama karakter
          <input
            type="text"
            placeholder="Contoh: Si Penjelajah"
            value={gName}
            onChange={(e) => setGName(e.target.value)}
          />
        </label>
        <label>
          Gaya bertarung
          <select value={gPower} onChange={(e) => setGPower(e.target.value)}>
            {POWER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Petunjuk harta karun (satu per baris, maksimal 10)
          <textarea
            rows={4}
            value={gClues}
            onChange={(e) => setGClues(e.target.value)}
            placeholder={
              "Petunjuk pertama\nPetunjuk kedua\nBaris terakhir = pesan harta karun"
            }
          />
          <small className="hint">
            Baris terakhir tampil sebagai harta karunnya. Isi petunjuk bisa
            dilihat publik, jadi jangan taruh kode bernilai di sini.
          </small>
        </label>
      </div>

      <button disabled={busy} onClick={submit}>
        {busy
          ? progress || "Menyimpan..."
          : editing
            ? "Simpan perubahan"
            : "Simpan"}
      </button>
      {editing && (
        <button className="small ghost" onClick={onCancel} disabled={busy}>
          Batal ubah
        </button>
      )}
      {msg && <p className="err">{msg}</p>}
      <p className="hint">
        QR tiap desain mengarah ke halaman video desain itu. Marker gambar tetap
        dipakai bersama lewat halaman Scan AR.
      </p>
    </div>
  );
}

function DesignCard({ design, onEdit, onQr, onToggle, onRemove }) {
  const link = designLink(design.slug);

  return (
    <div className="card">
      {design.image_url && (
        <img
          className="adm-thumb"
          src={design.image_url}
          alt=""
          loading="lazy"
        />
      )}
      <div className="row">
        <strong>{design.title || design.slug}</strong>
        <span className={design.active ? "on" : "off"}>
          {design.active ? "aktif" : "nonaktif"}
        </span>
      </div>
      <span className="ct-chip">
        {design.video_source === "youtube"
          ? "Video: YouTube"
          : "Video: unggahan"}
      </span>
      <code>{link}</code>
      <div className="row">
        <button className="small" onClick={() => onEdit(design)}>
          Ubah
        </button>
        <button
          className="small"
          onClick={() => window.open(localLink(design.slug), "_blank")}
        >
          Buka
        </button>
        <button
          className="small"
          onClick={() => navigator.clipboard.writeText(link)}
        >
          Salin link
        </button>
        <button className="small" onClick={() => onQr(design)}>
          QR
        </button>
        <button className="small" onClick={() => onToggle(design)}>
          {design.active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button className="small danger" onClick={() => onRemove(design)}>
          Hapus
        </button>
      </div>
    </div>
  );
}

function QrModal({ qr, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <img src={qr.url} alt={`QR ${qr.slug}`} style={{ width: "100%" }} />
        <code>{qr.link}</code>
        <a href={qr.url} download={`qr-${qr.slug}.png`}>
          Unduh PNG
        </a>
        <button className="small" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function DesignsTab({ designs, q, filter, onReload, onError }) {
  const [qr, setQr] = useState(null);
  const [editing, setEditing] = useState(null);
  const shown = visible(
    designs,
    q,
    filter,
    (d) => `${d.title || ""} ${d.slug}`,
  );

  const onEdit = (d) => {
    setEditing(d);
    document
      .getElementById("design-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onToggle = async (d) => {
    const { error } = await toggleDesign(d);
    if (error) onError(error.message);
    onReload();
  };

  const onRemove = async (d) => {
    if (
      !window.confirm(
        `Hapus desain "${d.slug}"? QR di kaos yang sudah tercetak akan berhenti bekerja.`,
      )
    )
      return;
    const { error } = await removeDesign(d);
    if (error) onError(error.message);
    if (editing?.slug === d.slug) setEditing(null);
    onReload();
  };

  const onQr = async (d) => {
    const link = designLink(d.slug);
    const url = await QRCode.toDataURL(link, { width: 512, margin: 2 });
    setQr({ slug: d.slug, url, link });
  };

  return (
    <div className="adm-split">
      <DesignForm
        key={editing ? `edit-${editing.slug}` : "new"}
        list={designs}
        editing={editing}
        onSaved={onReload}
        onCancel={() => setEditing(null)}
      />
      <div className="adm-list">
        {shown.map((d) => (
          <DesignCard
            key={d.slug}
            design={d}
            onEdit={onEdit}
            onQr={onQr}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
        {!shown.length && <p className="hint">Tidak ada desain.</p>}
      </div>
      {qr && <QrModal qr={qr} onClose={() => setQr(null)} />}
    </div>
  );
}
