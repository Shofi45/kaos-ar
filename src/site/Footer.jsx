import {
  ADDRESS,
  AR_URL,
  EMAIL,
  INSTAGRAM_URL,
  MENU,
  SHOPEE_URL,
  SITE_URL,
  WA_NUMBER,
} from "../config";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <strong>Zayfen</strong>
          <p>
            Kaos dan merchandise dengan efek AR. Arahkan kamera, lihat desainnya
            hidup.
          </p>
          <a className="foot-ar" href={AR_URL}>
            Coba Scan AR
          </a>
        </div>

        <div>
          <h4>Menu</h4>
          {MENU.map((m) => (
            <a key={m.path} href={SITE_URL + m.path}>
              {m.label}
            </a>
          ))}
        </div>

        <div>
          <h4>Kontak</h4>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          {INSTAGRAM_URL && (
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {SHOPEE_URL && (
            <a href={SHOPEE_URL} target="_blank" rel="noreferrer">
              Shopee
            </a>
          )}
          {EMAIL && <a href={`mailto:${EMAIL}`}>{EMAIL}</a>}
          {ADDRESS && <span>{ADDRESS}</span>}
        </div>
      </div>

      <div className="foot-copy">
        © {new Date().getFullYear()} Zayfen. Semua hak dilindungi.
      </div>
    </footer>
  );
}
