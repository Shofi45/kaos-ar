import { useEffect, useState } from "react";
import ARShirt from "./ARShirt";
import CameraTest from "./CameraTest";

const params = new URLSearchParams(window.location.search);
const DEBUG = params.has("debug");
const SLUG = params.get("d") || "contoh";

export default function App() {
  const [mode, setMode] = useState("menu");
  const [design, setDesign] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "designs.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("Daftar desain tidak bisa dimuat.");
        return r.json();
      })
      .then((list) => {
        if (!list[SLUG]) throw new Error(`Desain "${SLUG}" tidak ditemukan.`);
        setDesign(list[SLUG]);
      })
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
