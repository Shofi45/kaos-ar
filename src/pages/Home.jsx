import Page from "./Page";
import { AR_URL } from "../config";
import { rupiah, useProducts } from "../api";
import { useContent } from "../content";

export default function Home() {
  const c = useContent("home");
  const { items, loading } = useProducts(4);

  return (
    <Page>
      <section className="hero">
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
        <div className="hero-cta">
          <a className="pbtn" href={AR_URL}>
            Coba Scan AR
          </a>
          <a className="pbtn alt" href="/katalog">
            Lihat Katalog
          </a>
        </div>
      </section>

      <section className="sec">
        <h2>Cara kerja</h2>
        <div className="steps">
          {(c.steps || []).map((s, i) => (
            <div className="step" key={i}>
              <b>{i + 1}</b>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <h2>Produk pilihan</h2>
          <a href="/katalog">Lihat semua</a>
        </div>
        {loading && <p className="pg-note">Memuat...</p>}
        {!loading && !items.length && (
          <p className="pg-note">Produk segera hadir.</p>
        )}
        <div className="pgrid">
          {items.map((p) => (
            <div className="card" key={p.id}>
              <div className="pimg">
                {p.image_url && <img src={p.image_url} alt={p.name} />}
                {p.design_slug && <span className="pbadge">AR</span>}
              </div>
              <div className="pbody">
                <strong>{p.name}</strong>
                <span className="pprice">{rupiah(p.price)}</span>
                <div className="pactions">
                  <a className="pbtn alt" href="/katalog">
                    Lihat detail
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>{c.ctaTitle}</h2>
        <p>{c.ctaText}</p>
        <a className="pbtn" href={AR_URL}>
          Buka Scan AR
        </a>
      </section>
    </Page>
  );
}
