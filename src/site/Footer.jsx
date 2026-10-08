import { AR_URL } from "../config";
import { useContent } from "../content";

export default function Footer() {
  const k = useContent("kontak");
  const s = useContent("pengaturan");
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <strong>{s.brand}</strong>
          <p>{s.footerText}</p>
          <a className="foot-ar" href={AR_URL}>
            Coba Scan AR
          </a>
        </div>

        <div>
          <h4>Menu</h4>
          {(s.menu || []).map((m) => (
            <a key={m.path} href={m.path}>
              {m.label}
            </a>
          ))}
        </div>

        <div>
          <h4>Kontak</h4>
          {k.wa && (
            <a href={`https://wa.me/${k.wa}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          {k.instagram && (
            <a href={k.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {k.shopee && (
            <a href={k.shopee} target="_blank" rel="noreferrer">
              Shopee
            </a>
          )}
          {k.email && <a href={`mailto:${k.email}`}>{k.email}</a>}
          {k.address && <span>{k.address}</span>}
        </div>
      </div>

      <div className="foot-copy">
        © {new Date().getFullYear()} {s.copyright}
      </div>
    </footer>
  );
}