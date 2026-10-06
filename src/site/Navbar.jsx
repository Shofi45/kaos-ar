import { useState } from "react";
import { AR_URL, MENU } from "../config";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const here = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <header className="nav">
      <div className="nav-in">
        <a className="nav-logo" href="/">
          Zayfen
        </a>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          {MENU.map((m) => (
            <a
              key={m.path}
              href={m.path}
              className={here === m.path ? "act" : ""}
            >
              {m.label}
            </a>
          ))}
          <a className="nav-ar" href={AR_URL}>
            Scan AR
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
