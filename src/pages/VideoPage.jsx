import { useEffect, useState } from "react";
import Navbar from "../site/Navbar";
import Footer from "../site/Footer";
import { supabase } from "../supabase";
import { useProducts } from "../api";
import { AR_URL } from "../config";
import { useContent } from "../content";
import "../styles/pages.css";
import YouTubePlayer from "../site/YouTubePlayer";
import GameGate from "../game/GameGate";

export default function VideoPage({ slug }) {
  const s = useContent("pengaturan");
  const { items } = useProducts();
  const [d, setD] = useState(undefined);
  const [copied, setCopied] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setD(null);
      return;
    }
    supabase
      .from("designs")
      .select(
        "slug, title, image_url, video_url, video_source, youtube_id, youtube_portrait, game",
      )
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => setD(data || null));
  }, [slug]);

  useEffect(() => {
    if (d) document.title = `${d.title || d.slug} | ${s.brand}`;
  }, [d, s.brand]);

  const product = d ? items.find((p) => p.design_slug === d.slug) : null;
  const isYt = d?.video_source === "youtube" && d.youtube_id;
  const hasVideo = isYt || Boolean(d?.video_url);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: d.title || d.slug, url });
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
      <main className="vp">
        {d === undefined && <p className="pg-note">Memuat...</p>}

        {d === null && (
          <div className="pd-empty">
            <h2>Video tidak ditemukan</h2>
            <p className="pg-note">Desain ini mungkin sudah tidak aktif.</p>
            <a className="pbtn" href="/">
              Ke beranda
            </a>
          </div>
        )}

        {d && (
          <>
            <h1>{d.title || d.slug}</h1>

            {!hasVideo && <p className="pg-note">Video belum tersedia.</p>}

            {hasVideo && (
              <div
                className={
                  isYt && d.youtube_portrait
                    ? "vp-player portrait"
                    : "vp-player"
                }
              >
                {isYt ? (
                  <YouTubePlayer id={d.youtube_id} title={d.title || d.slug} />
                ) : (
                  <video
                    src={d.video_url}
                    poster={d.image_url || undefined}
                    controls
                    playsInline
                    autoPlay
                    muted
                    loop
                  />
                )}
              </div>
            )}
            <div className="vp-actions">
              <button className="pbtn" onClick={() => setGameOpen(true)}>
                Mainkan game
              </button>
              {product && (
                <a className="pbtn" href={`/produk/${product.id}`}>
                  Lihat produknya
                </a>
              )}
              <a className="pbtn alt" href={AR_URL}>
                Scan AR di kaos
              </a>
              {isYt && (
                <a
                  className="pbtn alt"
                  href={`https://www.youtube.com/watch?v=${d.youtube_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka di YouTube
                </a>
              )}
              <button className="pbtn alt" onClick={share}>
                {copied ? "Link disalin" : "Bagikan"}
              </button>
            </div>
          </>
        )}
      </main>
      {gameOpen && d && (
        <GameGate design={d} onClose={() => setGameOpen(false)} />
      )}
      <Footer />
    </div>
  );
}
