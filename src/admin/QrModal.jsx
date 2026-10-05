export default function QrModal({ qr, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <img src={qr.url} alt={`QR ${qr.slug}`} style={{ width: "100%" }} />
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
