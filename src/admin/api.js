import { supabase } from "../supabase";
import { BUCKET, withV } from "./constants";

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

export const saveDesign = async ({
  slug,
  title,
  targetFile,
  videoFile,
  old,
}) => {
  const target_url = targetFile
    ? await uploadFile(
        `${slug}/target.mind`,
        targetFile,
        "application/octet-stream",
      )
    : old.target_url;
  const video_url = videoFile
    ? await uploadFile(`${slug}/video.mp4`, videoFile, "video/mp4")
    : old.video_url;

  const { error } = await supabase.from("designs").upsert({
    slug,
    title: title.trim() || old?.title || slug,
    target_url,
    video_url,
    active: old ? old.active : true,
  });
  if (error) throw error;
};

export const toggleDesign = (d) =>
  supabase.from("designs").update({ active: !d.active }).eq("slug", d.slug);

export const removeDesign = async (d) => {
  await supabase.storage
    .from(BUCKET)
    .remove([`${d.slug}/target.mind`, `${d.slug}/video.mp4`]);
  return supabase.from("designs").delete().eq("slug", d.slug);
};
