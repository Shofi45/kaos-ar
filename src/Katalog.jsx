import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { AR_URL } from "./config";
import Navbar from "./site/Navbar";
import Footer from "./site/Footer";

const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export default function Katalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase belum dikonfigurasi.");
      setLoading(false);
      return;
    }
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems(data);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: "100%", overflow: "auto" }}>
      <Navbar />
      <main style={{ padding: "24px 16px" }}>
        {loading && <p>Memuat...</p>}
        {error && <p className="ar-error">{error}</p>}
        {!loading && !error && !items.length && <p>Belum ada produk.</p>}
        <div className="pgrid">
          {items.map((p) => (
            <div className="card" key={p.id}>
              <div className="pimg">
                {p.image_url && <img src={p.image_url} alt={p.name} />}
                {p.design_slug && <span className="pbadge">AR</span>}
              </div>
              <div className="pbody">
                <strong>{p.name}</strong>
                <span className="pprice">{rupiah(p.price)}</span>
                <div className="pactions">
                  {p.shopee_url && (
                    <a
                      className="pbtn"
                      href={p.shopee_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Beli di Shopee
                    </a>
                  )}
                  {p.design_slug && (
                    <a className="pbtn alt" href={AR_URL}>
                      Coba AR
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
