import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import { fetchDesigns, fetchProducts, rupiah } from "./api";
import DesignsTab from "./DesignsTab";
import ProductsTab from "./ProductsTab";
import ContentTab from "./ContentTab";
import { KATALOG_URL } from "../config";

const ICONS = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  design: "M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5",
  bag: "M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8",
  link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  out: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
};

const Icon = ({ name }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={ICONS[name]} />
  </svg>
);

const NAV = [
  { id: "home", label: "Dashboard", icon: "home" },
  { id: "desain", label: "Desain AR", icon: "design" },
  { id: "produk", label: "Produk", icon: "bag" },
  { id: "konten", label: "Konten", icon: "doc" },
];

const FILTERS = [
  ["all", "Semua"],
  ["aktif", "Aktif"],
  ["nonaktif", "Nonaktif"],
];

const SUBTITLE = {
  home: "Ringkasan desain AR dan produk brand kamu",
  desain: "Kelola gambar target dan video tiap desain",
  produk: "Kelola katalog produk dan link pembelian",
  konten: "Ubah isi Home, Tentang, Dokumentasi, dan Kontak",
};

function Status({ active }) {
  return (
    <span className={active ? "on" : "off"}>
      {active ? "aktif" : "nonaktif"}
    </span>
  );
}

function Home({ designs, products, onTab }) {
  const stats = [
    ["Total desain", designs.length],
    ["Desain aktif", designs.filter((d) => d.active).length],
    ["Total produk", products.length],
    ["Produk aktif", products.filter((p) => p.active).length],
  ];

  return (
    <>
      <div className="adm-stats">
        {stats.map(([label, value]) => (
          <div className="adm-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="adm-cols">
        <section className="adm-panel">
          <div className="adm-panel-head">
            <h3>Desain terbaru</h3>
            <button className="small ghost" onClick={() => onTab("desain")}>
              Lihat semua
            </button>
          </div>
          {designs.slice(0, 4).map((d) => (
            <div className="adm-line" key={d.slug}>
              <span>{d.title || d.slug}</span>
              <Status active={d.active} />
            </div>
          ))}
          {!designs.length && <p className="hint">Belum ada desain.</p>}
        </section>

        <section className="adm-panel">
          <div className="adm-panel-head">
            <h3>Produk terbaru</h3>
            <button className="small ghost" onClick={() => onTab("produk")}>
              Lihat semua
            </button>
          </div>
          {products.slice(0, 4).map((p) => (
            <div className="adm-line" key={p.id}>
              <span>{p.name}</span>
              <b>{rupiah(p.price)}</b>
            </div>
          ))}
          {!products.length && <p className="hint">Belum ada produk.</p>}
        </section>
      </div>

      <section className="adm-cta">
        <h3>Cetak QR setelah semua desain siap</h3>
        <p>
          QR yang sudah tercetak di kaos tidak bisa diubah. Pastikan semua
          desain aktif dan QR diunduh dari domain final.
        </p>
        <button onClick={() => onTab("desain")}>Buka Desain AR</button>
      </section>
    </>
  );
}

export default function Dashboard({ user }) {
  const [tab, setTab] = useState("home");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  const loadDesigns = useCallback(async () => {
    const { data, error } = await fetchDesigns();
    if (error) setMsg(error.message);
    else setDesigns(data);
  }, []);

  const loadProducts = useCallback(async () => {
    const { data, error } = await fetchProducts();
    if (error) setMsg(error.message);
    else setProducts(data);
  }, []);

  useEffect(() => {
    loadDesigns();
    loadProducts();
  }, [loadDesigns, loadProducts]);

  const go = (id) => {
    setTab(id);
    setFilter("all");
    setQ("");
    setOpen(false);
  };

  const email = user?.email || "";
  const name = email.split("@")[0] || "Admin";
  const label = NAV.find((n) => n.id === tab).label;

  return (
    <div className="adm-shell">
      <div className="adm-frame">
        <aside className={open ? "adm-side open" : "adm-side"}>
          <div className="adm-brand">
            <strong>AR Kaos</strong>
            <button
              className="adm-close"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <Icon name="close" />
            </button>
          </div>
          <nav className="adm-nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={tab === n.id ? "adm-item act" : "adm-item"}
                onClick={() => go(n.id)}
              >
                <Icon name={n.icon} />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="adm-foot">
            <a
              className="adm-item"
              href={KATALOG_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="link" />
              Katalog di zayfen.id
            </a>
            <a className="adm-item" href="/" target="_blank" rel="noreferrer">
              <Icon name="scan" />
              Scan AR
            </a>
            <button
              className="adm-item adm-out"
              onClick={() => supabase.auth.signOut()}
            >
              <Icon name="out" />
              Keluar
            </button>
          </div>
        </aside>

        {open && <div className="adm-overlay" onClick={() => setOpen(false)} />}

        <div className="adm-content">
          <header className="adm-head">
            <button
              className="adm-burger"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Icon name="menu" />
            </button>
            <div className="adm-title">
              <h1>
                {tab === "home" ? (
                  <>
                    Halo, <span>{name}</span>
                  </>
                ) : (
                  label
                )}
              </h1>
              <p>{SUBTITLE[tab]}</p>
            </div>
            {(tab === "desain" || tab === "produk") && (
              <label className="adm-search">
                <Icon name="search" />
                <input
                  type="search"
                  placeholder="Cari..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
            )}
            <div className="adm-user">
              <span className="adm-avatar">{name.charAt(0)}</span>
              <div>
                <strong>{name}</strong>
                <small>{email}</small>
              </div>
            </div>
          </header>

          {msg && <p className="err">{msg}</p>}
          {(tab === "desain" || tab === "produk") && (
            <div className="adm-pills">
              {FILTERS.map(([id, text]) => (
                <button
                  key={id}
                  className={filter === id ? "act" : ""}
                  onClick={() => setFilter(id)}
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {tab === "home" && (
            <Home designs={designs} products={products} onTab={go} />
          )}
          {tab === "konten" && <ContentTab onError={setMsg} />}
          {tab === "desain" && (
            <DesignsTab
              designs={designs}
              q={q}
              filter={filter}
              onReload={loadDesigns}
              onError={setMsg}
            />
          )}
          {tab === "produk" && (
            <ProductsTab
              products={products}
              designs={designs}
              q={q}
              filter={filter}
              onReload={loadProducts}
              onError={setMsg}
            />
          )}
        </div>
      </div>
    </div>
  );
}
