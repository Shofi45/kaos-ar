import { useEffect, useRef, useState } from "react";
import Navbar from "../site/Navbar";
import Footer from "../site/Footer";
import ProductCard from "../site/ProductCard";
import { rupiah, useProducts } from "../api";
import { AR_URL, WA_NUMBER } from "../config";
import { useContent } from "../content";
import "../styles/pages.css";

export default function ProdukDetail({ id }) {
  const { items, loading, error } = useProducts();
  const k = useContent("kontak");
  const s = useContent("pengaturan");
  const [zoom, setZoom] = useState(false);
  const [idx, setIdx] = useState(0);
  const sliderRef = useRef(null);

  const onSlide = () => {
    const el = sliderRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  const goTo = (i) => {
    const el = sliderRef.current;
    setIdx(i);
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const [copied, setCopied] = useState(false);

  const p = items.find((x) => x.id === id);
  const gallery = p?.images?.length
    ? p.images
    : p?.image_url
      ? [p.image_url]
      : [];
  const others = items.filter((x) => x.id !== id);
  const same = p?.category
    ? others.filter((x) => x.category === p.category)
    : [];
  const related = [...same, ...others.filter((x) => !same.includes(x))].slice(
    0,
    4,
  );

  const off =
    p?.old_price && p.old_price > p.price
      ? Math.round((1 - p.price / p.old_price) * 100)
      : 0;

  useEffect(() => {
    if (p) document.title = `${p.name} | ${s.brand}`;
  }, [p, s.brand]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* dibatalkan pengguna */
    }
  };

  const specs = p
    ? [
        ["Kategori", p.category],
        ["Jenis print", p.print_type],
        ["Jenis kain", p.fabric],
        ["Efek AR", p.design_slug ? "Ada" : ""],
      ].filter(([, v]) => v)
    : [];

  const wa = p
    ? `https://wa.me/${k.wa || WA_NUMBER}?text=${encodeURIComponent(
        `Halo, saya tertarik dengan ${p.name}. ${window.location.href}`,
      )}`
    : "";

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <Navbar />
      <main className="pd">
        <p className="pd-crumb">
          <a href="/">Home</a> / <a href="/katalog">Katalog</a>
          {p && <> / {p.name}</>}
        </p>

        {loading && <p className="pg-note">Memuat...</p>}
        {error && <p className="ar-error">{error}</p>}

        {!loading && !error && !p && (
          <div className="pd-empty">
            <h2>Produk tidak ditemukan</h2>
            <p className="pg-note">Produk ini mungkin sudah tidak dijual.</p>
            <a className="pbtn" href="/katalog">
              Lihat katalog
            </a>
          </div>
        )}

        {p && (
          <>
            <div className="pd-grid">
              <div className="pd-media">
                <div className="pd-slidewrap">
                  <div className="pd-slider" ref={sliderRef} onScroll={onSlide}>
                    {gallery.map((u, i) => (
                      <button
                        key={u}
                        className="pd-img pd-slide"
                        onClick={() => setZoom(true)}
                        aria-label="Perbesar gambar"
                      >
                        <img src={u} alt={`${p.name} ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                  {off > 0 && <span className="kbadge">{off}% off</span>}
                  {p.design_slug && <span className="kar">AR</span>}
                </div>

                {gallery.length > 1 && (
                  <div className="pd-thumbs">
                    {gallery.map((u, i) => (
                      <button
                        key={u}
                        className={i === idx ? "act" : ""}
                        onClick={() => goTo(i)}
                        aria-label={`Foto ${i + 1}`}
                      >
                        <img src={u} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pd-info">
                {p.category && <small>{p.category}</small>}
                <h1>{p.name}</h1>
                <div className="pd-price">
                  <b>{rupiah(p.price)}</b>
                  {off > 0 && <s>{rupiah(p.old_price)}</s>}
                  {off > 0 && <span className="pd-off">Hemat {off}%</span>}
                </div>

                {specs.length > 0 && (
                  <dl className="pd-specs">
                    {specs.map(([label, value]) => (
                      <div className="pd-spec" key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {p.description && <p className="pd-desc">{p.description}</p>}

                <div className="pd-actions">
                  {p.shopee_url && (
                    <a
                      className="pbtn"
                      href={p.shopee_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Beli di Shopee
                    </a>
                  )}
                  {p.design_slug && (
                    <a className="pbtn alt" href={AR_URL}>
                      Coba AR
                    </a>
                  )}
                  <a
                    className="pbtn alt"
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tanya lewat WhatsApp
                  </a>
                  <button className="pbtn alt" onClick={share}>
                    {copied ? "Link disalin" : "Bagikan"}
                  </button>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <section className="pd-related">
                <h2>Produk lainnya</h2>
                <div className="kgrid">
                  {related.map((r) => (
                    <ProductCard key={r.id} p={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {zoom && p?.image_url && (
        <div className="pd-zoom" onClick={() => setZoom(false)}>
          <img src={gallery[idx] || p.image_url} alt={p.name} />
        </div>
      )}
      <Footer />
    </div>
  );
}
