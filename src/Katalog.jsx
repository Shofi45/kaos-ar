import { useEffect, useMemo, useState } from "react";
import Navbar from "./site/Navbar";
import Footer from "./site/Footer";
import ProductCard from "./site/ProductCard";
import { rupiah, useProducts } from "./api";
import { WA_NUMBER } from "./config";

const PER_PAGE = 12;

const SORTS = [
  ["baru", "Terbaru"],
  ["murah", "Harga terendah"],
  ["mahal", "Harga tertinggi"],
  ["nama", "Nama A-Z"],
];

const initial = new URLSearchParams(window.location.search);

export default function Katalog() {
  const { items, loading, error } = useProducts();
  const [q, setQ] = useState(initial.get("q") || "");
  const [cats, setCats] = useState(
    initial.get("cat") ? [initial.get("cat")] : [],
  );
  const [maxP, setMaxP] = useState(null);
  const [onlyAr, setOnlyAr] = useState(false);
  const [onlySale, setOnlySale] = useState(false);
  const [sort, setSort] = useState("baru");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const allCats = useMemo(
    () => [...new Set(items.map((p) => p.category).filter(Boolean))],
    [items],
  );

  const top = useMemo(() => {
    const m = Math.max(0, ...items.map((p) => p.price));
    return Math.max(1000, Math.ceil(m / 1000) * 1000);
  }, [items]);

  const limit = maxP === null ? top : Math.min(maxP, top);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((p) => {
      if (term && !`${p.name} ${p.category}`.toLowerCase().includes(term))
        return false;
      if (cats.length && !cats.includes(p.category)) return false;
      if (p.price > limit) return false;
      if (onlyAr && !p.design_slug) return false;
      if (onlySale && !(p.old_price && p.old_price > p.price)) return false;
      return true;
    });
    const by = {
      baru: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      murah: (a, b) => a.price - b.price,
      mahal: (a, b) => b.price - a.price,
      nama: (a, b) => a.name.localeCompare(b.name),
    }[sort];
    return [...list].sort(by);
  }, [items, q, cats, limit, onlyAr, onlySale, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, cats, maxP, onlyAr, onlySale, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const toggleCat = (k) =>
    setCats((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );

  const active = [
    ...(q.trim()
      ? [{ key: "q", label: `"${q.trim()}"`, off: () => setQ("") }]
      : []),
    ...cats.map((k) => ({ key: "c" + k, label: k, off: () => toggleCat(k) })),
    ...(maxP !== null && maxP < top
      ? [{ key: "p", label: `Maks ${rupiah(limit)}`, off: () => setMaxP(null) }]
      : []),
    ...(onlyAr
      ? [{ key: "ar", label: "Ada efek AR", off: () => setOnlyAr(false) }]
      : []),
    ...(onlySale
      ? [{ key: "sale", label: "Diskon", off: () => setOnlySale(false) }]
      : []),
  ];

  const clearAll = () => {
    setQ("");
    setCats([]);
    setMaxP(null);
    setOnlyAr(false);
    setOnlySale(false);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <Navbar />
      <main className="kt">
        <header className="kt-head">
          <h1>Katalog</h1>
          <p>
            <a href="/">Home</a> / Katalog
          </p>
        </header>

        <button className="kt-toggle" onClick={() => setShowFilter((s) => !s)}>
          {showFilter ? "Tutup filter" : "Tampilkan filter"}
        </button>

        <div className="kt-layout">
          <aside className={showFilter ? "kt-side open" : "kt-side"}>
            <h3>Filter</h3>

            <div className="kt-group">
              <h4>Cari</h4>
              <input
                value={q}
                placeholder="Nama produk..."
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {allCats.length > 0 && (
              <div className="kt-group">
                <h4>Kategori</h4>
                {allCats.map((k) => (
                  <label key={k}>
                    <input
                      type="checkbox"
                      checked={cats.includes(k)}
                      onChange={() => toggleCat(k)}
                    />
                    {k}
                  </label>
                ))}
              </div>
            )}

            <div className="kt-group">
              <h4>Harga maksimal</h4>
              <input
                type="range"
                min="0"
                max={top}
                step="1000"
                value={limit}
                onChange={(e) => setMaxP(Number(e.target.value))}
              />
              <span className="kt-range">Sampai {rupiah(limit)}</span>
            </div>

            <div className="kt-group">
              <h4>Promo</h4>
              <label>
                <input
                  type="checkbox"
                  checked={onlyAr}
                  onChange={(e) => setOnlyAr(e.target.checked)}
                />
                Ada efek AR
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(e) => setOnlySale(e.target.checked)}
                />
                Sedang diskon
              </label>
            </div>
          </aside>

          <section className="kt-main">
            <div className="kt-bar">
              <span>
                Menampilkan {filtered.length ? (current - 1) * PER_PAGE + 1 : 0}
                -{Math.min(current * PER_PAGE, filtered.length)} dari{" "}
                {filtered.length} produk
              </span>
              <label className="kt-sort">
                Urutkan
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {active.length > 0 && (
              <div className="kt-active">
                <span>Filter aktif</span>
                {active.map((a) => (
                  <button key={a.key} className="kt-chip" onClick={a.off}>
                    {a.label} ×
                  </button>
                ))}
                <button className="kt-clear" onClick={clearAll}>
                  Hapus semua
                </button>
              </div>
            )}

            {loading && <p className="pg-note">Memuat...</p>}
            {error && <p className="ar-error">{error}</p>}
            {!loading && !error && !filtered.length && (
              <p className="pg-note">Tidak ada produk yang cocok.</p>
            )}

            <div className="kgrid">
              {shown.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>

            {pages > 1 && (
              <div className="kt-pager">
                <button
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={n === current ? "act" : ""}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="kt-feats">
          <div>
            <strong>Beli di Shopee</strong>
            <span>Pembayaran dan pengiriman lewat toko resmi.</span>
          </div>
          <div>
            <strong>Efek AR</strong>
            <span>Produk berlabel AR bisa discan lewat kamera.</span>
          </div>
          <div>
            <strong>Butuh bantuan?</strong>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noreferrer"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
