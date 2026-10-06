import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export function useProducts(limit) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase belum dikonfigurasi.");
      setLoading(false);
      return;
    }
    let query = supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (limit) query = query.limit(limit);
    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setItems(data);
      setLoading(false);
    });
  }, [limit]);

  return { items, loading, error };
}
