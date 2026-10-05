import { designLink } from "./constants";

export default function DesignCard({ design, onQr, onToggle, onRemove }) {
  const link = designLink(design.slug);

  return (
    <div className="card">
      <div className="row">
        <strong>{design.title || design.slug}</strong>
        <span className={design.active ? "on" : "off"}>
          {design.active ? "aktif" : "nonaktif"}
        </span>
      </div>
      <code>{link}</code>
      <div className="row">
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
