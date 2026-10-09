import { useEffect, useState } from "react";
import Navbar from "../site/Navbar";
import Footer from "../site/Footer";
import { supabase } from "../supabase";
import { useContent } from "../content";
import "../styles/pages.css";

const dateText = (v) =>
  v
    ? new Date(v).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export default function GaleriDetail({ id }) {
  const s = useContent("pengaturan");
  const [items, setItems] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setItems([]);
      return;
    }
    supabase
      .from("gallery")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, []);

  const i = items ? items.findIndex((g) => g.id === id) : -1;
  const g = i >= 0 ? items[i] : null;
  const prev = g && i > 0 ? items[i - 1] : null;
  const next = g && i < items.length - 1 ? items[i + 1] : null;
  const more = g ? items.filter((x) => x.id !== id).slice(0, 8) : [];

  useEffect(() => {
    if (g) document.title = `${g.title || "Galeri"} | ${s.brand}`;
  }, [g, s.brand]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" && prev)
        window.location.assign(`/galeri/${prev.id}`);
      if (e.key === "ArrowRight" && next)
        window.location.assign(`/galeri/${next.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: g.title || "Galeri", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* dibatalkan pengguna */
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <Navbar />
      <main className="gd">
        <p className="pd-crumb">
          <a href="/">Home</a> / <a href="/galeri">Galeri</a>
          {g && g.title && <> / {g.title}</>}
        </p>

        {!items && <p className="pg-note">Memuat...</p>}

        {items && !g && (
          <div className="pd-empty">
            <h2>Gambar tidak ditemukan</h2>
            <p className="pg-note">Gambar ini mungkin sudah dihapus.</p>
            <a className="pbtn" href="/galeri">
              Kembali ke galeri
            </a>
          </div>
        )}

        {g && (
          <>
            <figure className="gd-fig">
              <img src={g.image_url} alt={g.title || "Galeri"} />
            </figure>

            <div className="gd-meta">
              {g.title && <h1>{g.title}</h1>}
              <p>{dateText(g.created_at)}</p>
            </div>

            <div className="gd-nav">
              {prev ? (
                <a className="pbtn alt" href={`/galeri/${prev.id}`}>
                  ‹ Sebelumnya
                </a>
              ) : (
                <span />
              )}
              <button className="pbtn alt" onClick={share}>
                {copied ? "Link disalin" : "Bagikan"}
              </button>
              {next ? (
                <a className="pbtn alt" href={`/galeri/${next.id}`}>
                  Berikutnya ›
                </a>
              ) : (
                <span />
              )}
            </div>

            {more.length > 0 && (
              <section className="gd-more">
                <h2>Gambar lainnya</h2>
                <div className="gd-thumbs">
                  {more.map((m) => (
                    <a key={m.id} href={`/galeri/${m.id}`}>
                      <img
                        src={m.image_url}
                        alt={m.title || "Galeri"}
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
