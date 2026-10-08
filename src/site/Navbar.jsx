import { useState } from "react";
import { AR_URL } from "../config";
import { useContent } from "../content";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const s = useContent("pengaturan");
  const here = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <header className="nav">
      <div className="nav-in">
        <a className="nav-logo" href="/">
          {s.brand}
        </a>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          {(s.menu || []).map((m) => (
            <a
              key={m.path}
              href={m.path}
              className={here === m.path ? "act" : ""}
            >
              {m.label}
            </a>
          ))}
          <a className="nav-ar" href={AR_URL}>
            {s.navButton}
          </a>
        </nav>

        <button
          className="nav-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}