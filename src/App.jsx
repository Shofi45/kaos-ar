import { useEffect, useState } from "react";
import ARShirt from "./ARShirt";
import CameraTest from "./CameraTest";
import Admin from "./Admin";
import { supabase } from "./supabase";

const params = new URLSearchParams(window.location.search);
const DEBUG = params.has("debug");
const ADMIN = params.has("admin");
const SLUG = params.get("d");

async function loadDesign(slug) {
  if (supabase && !slug) {
    const { data, error } = await supabase
      .from("designs")
      .select("target_url, video_url")
      .not("pos", "is", null)
      .order("pos", { ascending: true });
    if (error) console.error(error);
    if (data && data.length) {
      return {
        target: data[0].target_url,
        videos: data.map((d) => d.video_url),
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
      {DEBUG && (
        <button className="ghost" onClick={() => setMode("test")}>
          Tes kamera dasar
        </button>
      )}
    </div>
  );
}

export default function App() {
  return ADMIN ? <Admin /> : <Viewer />;
}
