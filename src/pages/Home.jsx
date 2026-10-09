import { useEffect, useRef, useState } from "react";
import Page from "./Page";
import ProductCard from "../site/ProductCard";
import { AR_URL } from "../config";
import { ICON_PATHS } from "../site/icons";
import { useProducts } from "../api";
import { useContent } from "../content";
import { supabase } from "../supabase";

const Icon = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export default function Home() {
  const c = useContent("home");
  const { items, loading } = useProducts();
  const [gallery, setGallery] = useState([]);
  const rail = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("gallery")
      .select("id, title, image_url")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setGallery(data || []));
  }, []);

  const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
  const hero = items.find((p) => p.image_url);
  const scroll = (dir) =>
    rail.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <Page>
      <section className="hx">
        <div className="hx-text">
          {c.tag && <span className="hx-tag">{c.tag}</span>}
          <h1>{c.title}</h1>
          <p>{c.lead}</p>
          <form className="hx-search" action="/katalog" method="get">
            <input name="q" placeholder={c.searchPlaceholder} />
            <button type="submit">Cari</button>
          </form>
          {cats.length > 0 && (
            <div className="hx-pop">
              <span>Populer:</span>
              {cats.slice(0, 4).map((k) => (
                <a key={k} href={`/katalog?cat=${encodeURIComponent(k)}`}>
                  {k}
                </a>
              ))}
            </div>
          )}
          <div className="hero-cta hx-cta">
            <a className="pbtn" href={AR_URL}>
              Coba Scan AR
            </a>
            <a className="pbtn alt" href="/katalog">
              Lihat Katalog
            </a>
          </div>
        </div>
        <div className="hx-vis">
          {hero ? (
            <img src={hero.image_url} alt={hero.name} />
          ) : (
            <div className="hx-ph">Zayfen</div>
          )}
          {c.floatText && <span className="hx-float">{c.floatText}</span>}
        </div>
      </section>

      {cats.length > 0 && (
        <section className="cats">
          <a className="cat" href="/katalog">
            <span className="cat-dot on">Semua</span>
          </a>
          {cats.slice(0, 8).map((k) => (
            <a
              className="cat"
              key={k}
              href={`/katalog?cat=${encodeURIComponent(k)}`}
            >
              <span className="cat-dot">{k.charAt(0).toUpperCase()}</span>
              <em>{k}</em>
            </a>
          ))}
        </section>
      )}

      <section className="sec">
        <div className="sec-head">
          <div>
            <h2>{c.featuredTitle}</h2>
            <p className="pg-note">{c.featuredNote}</p>
          </div>
          <div className="hs-nav">
            <a href="/katalog">Lihat semua</a>
            <button onClick={() => scroll(-1)} aria-label="Geser kiri">
              ‹
            </button>
            <button onClick={() => scroll(1)} aria-label="Geser kanan">
              ›
            </button>
          </div>
        </div>
        {loading && <p className="pg-note">Memuat...</p>}
        {!loading && !items.length && (
          <p className="pg-note">Produk segera hadir.</p>
        )}
        <div className="hscroll" ref={rail}>
          {items.slice(0, 8).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="promo">
        <div>
          {c.promoTag && <span className="hx-tag">{c.promoTag}</span>}
          <h2>{c.ctaTitle}</h2>
          <p>{c.ctaText}</p>
          <a className="pbtn" href={AR_URL}>
            Buka Scan AR
          </a>
        </div>
      </section>

      <section className="sec">
        <h2>{c.featuresTitle}</h2>
        <div className="why">
          {(c.features || []).map((f, i) => (
            <div className="why-item" key={i}>
              <span className="why-ic">
                <Icon d={ICON_PATHS[f.icon] || ICON_PATHS.star} />
              </span>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>{c.stepsTitle}</h2>
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

      <section className="phone-sec">
        <div className="phone">
          <div className="phone-screen">
            <span>Arahkan ke gambar di kaos</span>
          </div>
        </div>
        <div className="phone-text">
          <h2>{c.phoneTitle}</h2>
          <p>{c.phoneText}</p>
          <div className="hero-cta hx-cta">
            <a className="pbtn" href={AR_URL}>
              Scan AR Sekarang
            </a>
            <a className="pbtn alt" href="/dokumentasi">
              Panduan
            </a>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="sec">
          <div className="sec-head">
            <h2>Galeri</h2>
            <a href="/galeri">Lihat semua</a>
          </div>
          <div className="gstrip">
            {gallery.map((g) => (
              <a key={g.id} href={`/galeri/${g.id}`}>
                <img src={g.image_url} alt={g.title} loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
