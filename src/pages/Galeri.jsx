import { useEffect, useState } from "react";
import Page from "./Page";
import { supabase } from "../supabase";
import { useContent } from "../content";

export default function Galeri() {
  const c = useContent("galeri");
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setItems([]);
      return;
    }
    supabase
      .from("gallery")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, []);

  return (
    <Page title={c.title} lead={c.lead}>
      <section className="sec">
        {!items && <p className="pg-note">Memuat...</p>}
        {items && !items.length && <p className="pg-note">{c.emptyText}</p>}
        <div className="ggrid">
          {(items || []).map((g) => (
            <figure className="gitem" key={g.id}>
              <img src={g.image_url} alt={g.title} loading="lazy" />
              {g.title && <figcaption>{g.title}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
    </Page>
  );
}