import { useEffect, useState } from "react";
import ARShirt from "./ARShirt";
import CameraTest from "./CameraTest";
import Admin from "./Admin";
import Katalog from "./Katalog";
import Home from "./pages/Home";
import Tentang from "./pages/Tentang";
import Dokumentasi from "./pages/Dokumentasi";
import Kontak from "./pages/Kontak";
import { KATALOG_URL, SITE_URL } from "./config";
import { supabase } from "./supabase";

const params = new URLSearchParams(window.location.search);
const DEBUG = params.has("debug");
const ADMIN = params.has("admin");
const SHOP = params.has("produk");
const SLUG = params.get("d");
const KATALOG = window.location.pathname.replace(/\/$/, "") === "/katalog";
const PATH = window.location.pathname.replace(/\/+$/, "") || "/";
const AR_HOST =
  window.location.hostname.startsWith("ar.") ||
  params.has("ar") ||
  DEBUG ||
  Boolean(SLUG);
const PAGES = {
  "/": Home,
  "/tentang": Tentang,
  "/dokumentasi": Dokumentasi,
  "/kontak": Kontak,
};

async function loadDesign(slug) {
  if (supabase && !slug) {
    const { data, error } = await supabase
      .from("designs")
      .select("slug, target_url, video_url")
      .not("pos", "is", null)
      .order("pos", { ascending: true });
    if (error) console.error(error);
    if (data && data.length) {
      return {
        target: data[0].target_url,
        videos: data.map((d) => d.video_url),
        slugs: data.map((d) => d.slug),
      };
    }
  }
  slug = slug || "contoh";
  if (supabase) {
    const { data, error } = await supabase
      .from("designs")
      .select("target_url, video_url")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) console.error(error);
    if (data) return { target: data.target_url, video: data.video_url };
  }
  const r = await fetch(import.meta.env.BASE_URL + "designs.json", {
    cache: "no-cache",
  });
  if (!r.ok) throw new Error("Daftar desain tidak bisa dimuat.");
  const list = await r.json();
  if (!list[slug]) throw new Error(`Desain "${slug}" tidak ditemukan.`);
  return list[slug];
}

function Viewer() {
  const [mode, setMode] = useState("menu");
  const [design, setDesign] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDesign(SLUG)
      .then(setDesign)
      .catch((e) => setError(e.message));
  }, []);

  if (mode === "ar" && design) {
    return <ARShirt design={design} onBack={() => setMode("menu")} />;
  }
  if (mode === "test") return <CameraTest onBack={() => setMode("menu")} />;

  return (
    <div className="ar-overlay">
      <h1>AR Kaos</h1>
      <p>Arahkan kamera ke desain di kaos.</p>
      {error && <p className="ar-error">{error}</p>}
      <button disabled={!design} onClick={() => setMode("ar")}>
        {design || error ? "Mulai AR" : "Memuat..."}
      </button>
      <a className="ar-link" href={SITE_URL} target="_blank" rel="noreferrer">
        Lihat produk kami
      </a>
      {DEBUG && (
        <button className="ghost" onClick={() => setMode("test")}>
          Tes kamera dasar
        </button>
      )}
    </div>
  );
}

function Redirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

export default function App() {
  if (ADMIN) return <Admin />;
  if (KATALOG) return <Katalog />;
  if (SHOP) return <Redirect to={KATALOG_URL} />;
  const Page = PAGES[PATH];
  if (Page && !(PATH === "/" && AR_HOST)) return <Page />;
  return <Viewer />;
}
