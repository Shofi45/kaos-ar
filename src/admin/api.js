import { supabase } from "../supabase";
import { compileMind } from "./compileMind";

const BUCKET = "designs";
const COMBINED = "all/targets.mind";

export const slugOk = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

export const designLink = () => `${window.location.origin}/`;

export const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export const visible = (list, q, filter, textOf) =>
  list.filter((x) => {
    const okStatus = filter === "all" || (filter === "aktif") === x.active;
    return okStatus && textOf(x).toLowerCase().includes(q.trim().toLowerCase());
  });

const withV = (u) => `${u}?v=${Date.now()}`;

const uploadFile = async (path, file, type) => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: type,
    cacheControl: "3600",
  });
  if (error) throw error;
  return withV(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
};

export const fetchDesigns = () =>
  supabase
    .from("designs")
    .select("*")
    .order("created_at", { ascending: false });

const rebuild = async (onProgress) => {
  const { data: rows, error } = await supabase
    .from("designs")
    .select("slug, image_url")
    .eq("active", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!rows.length) return;

  const blobs = await Promise.all(
    rows.map(async (r) => {
      const res = await fetch(r.image_url);
      if (!res.ok) throw new Error(`Gambar ${r.slug} tidak bisa diambil`);
      return res.blob();
    }),
  );

  const mind = await compileMind(blobs, onProgress);
  const target_url = await uploadFile(
    COMBINED,
    mind,
    "application/octet-stream",
  );

  const results = await Promise.all(
    rows.map((r, i) =>
      supabase
        .from("designs")
        .update({ pos: i, target_url })
        .eq("slug", r.slug),
    ),
  );
  const failed = results.find((x) => x.error);
  if (failed) throw failed.error;
};

export const saveDesign = async ({
  slug,
  title,
  imageFile,
  videoFile,
  old,
  onProgress,
}) => {
  const image_url = imageFile
    ? await uploadFile(`${slug}/image`, imageFile, imageFile.type)
    : old.image_url;
  const video_url = videoFile
    ? await uploadFile(`${slug}/video.mp4`, videoFile, "video/mp4")
    : old.video_url;

  const { error } = await supabase.from("designs").upsert({
    slug,
    title: title.trim() || old?.title || slug,
    image_url,
    video_url,
    target_url: old?.target_url || "",
    active: old ? old.active : true,
  });
  if (error) throw error;

  if (imageFile || !old) await rebuild(onProgress);
};

export const toggleDesign = async (d) => {
  const res = await supabase
    .from("designs")
    .update({ active: !d.active })
    .eq("slug", d.slug);
  if (res.error) return res;
  try {
    await rebuild();
  } catch (error) {
    return { error };
  }
  return res;
};

export const removeDesign = async (d) => {
  await supabase.storage
    .from(BUCKET)
    .remove([
      `${d.slug}/image`,
      `${d.slug}/video.mp4`,
      `${d.slug}/target.mind`,
    ]);
  const res = await supabase.from("designs").delete().eq("slug", d.slug);
  if (res.error) return res;
  try {
    await rebuild();
  } catch (error) {
    return { error };
  }
  return res;
};

export const fetchProducts = () =>
  supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

export const saveProduct = async (p) => {
  const id = p.old?.id || crypto.randomUUID();
  const image_url = p.imageFile
    ? await uploadFile(`products/${id}/image`, p.imageFile, p.imageFile.type)
    : p.old?.image_url || "";

  const { error } = await supabase.from("products").upsert({
    id,
    name: p.name,
    price: p.price,
    old_price: p.old_price,
    category: p.category,
    fabric: p.fabric || "",
    print_type: p.print_type || "",
    image_url,
    shopee_url: p.shopee_url,
    design_slug: p.design_slug || null,
    active: p.old ? p.old.active : true,
  });
  if (error) throw error;
};

export const toggleProduct = (p) =>
  supabase.from("products").update({ active: !p.active }).eq("id", p.id);

export const removeProduct = async (p) => {
  await supabase.storage.from(BUCKET).remove([`products/${p.id}/image`]);
  return supabase.from("products").delete().eq("id", p.id);
};
export const fetchGallery = () =>
  supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

export const saveGalleryItem = async (g) => {
  const id = g.old?.id || crypto.randomUUID();
  const image_url = g.imageFile
    ? await uploadFile(`gallery/${id}/image`, g.imageFile, g.imageFile.type)
    : g.old.image_url;

  const { error } = await supabase.from("gallery").upsert({
    id,
    title: g.title,
    image_url,
    active: g.old ? g.old.active : true,
  });
  if (error) throw error;
};

export const toggleGallery = (g) =>
  supabase.from("gallery").update({ active: !g.active }).eq("id", g.id);

export const removeGallery = async (g) => {
  await supabase.storage.from(BUCKET).remove([`gallery/${g.id}/image`]);
  return supabase.from("gallery").delete().eq("id", g.id);
};
