import { useState } from "react";
import { AR_URL, MENU, SITE_URL } from "../config";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const onSite = window.location.hostname === new URL(SITE_URL).hostname;
  const here = onSite ? window.location.pathname.replace(/\/$/, "") || "/" : "";

  return (
    <header className="nav">
      <div className="nav-in">
        <a className="nav-logo" href={SITE_URL}>
          Zayfen
        </a>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          {MENU.map((m) => (
            <a
              key={m.path}
              href={SITE_URL + m.path}
              className={here === m.path ? "act" : ""}
              onClick={() => setOpen(false)}
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
