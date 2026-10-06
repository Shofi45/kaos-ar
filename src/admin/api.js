import { supabase } from "../supabase";
import { BUCKET, withV } from "./constants";
import { compileMind } from "./compileMind";

const COMBINED = "all/targets.mind";

export const fetchDesigns = () =>
  supabase
    .from("designs")
    .select("*")
    .order("created_at", { ascending: false });

const uploadFile = async (path, file, type) => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: type,
    cacheControl: "3600",
  });
  if (error) throw error;
  return withV(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
};

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
