import Page from "./Page";
import { useContent } from "../content";

export default function Kontak() {
  const c = useContent("kontak");

  const rows = [
    c.wa && [
      "WhatsApp",
      "Chat langsung untuk tanya produk",
      `https://wa.me/${c.wa}`,
    ],
    c.instagram && ["Instagram", "Ikuti update terbaru", c.instagram],
    c.shopee && ["Shopee", "Belanja di toko kami", c.shopee],
    c.email && ["Email", c.email, `mailto:${c.email}`],
  ].filter(Boolean);

  return (
    <Page title="Kontak" lead={c.lead}>
      <section className="sec">
        <div className="contact-list">
          {rows.map(([t, d, href]) => (
            <a
              className="info contact-item"
              key={t}
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              <h3>{t}</h3>
              <p>{d}</p>
            </a>
          ))}
        </div>
        {c.address && <p className="pg-text">{c.address}</p>}
      </section>
    </Page>
  );
}
