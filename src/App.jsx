import { useState } from "react";
import ARShirt from "./ARShirt";
import CameraTest from "./CameraTest";

export default function App() {
  const [mode, setMode] = useState("menu");

  if (mode === "ar") return <ARShirt onBack={() => setMode("menu")} />;
  if (mode === "test") return <CameraTest onBack={() => setMode("menu")} />;

  return (
    <div className="ar-overlay">
      <h1>AR Kaos</h1>
      <p>Arahkan kamera ke desain di kaos.</p>
      <button onClick={() => setMode("ar")}>Mulai AR</button>
      <button className="ghost" onClick={() => setMode("test")}>
        Tes kamera dasar
      </button>
    </div>
  );
}