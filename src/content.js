import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { ADDRESS, EMAIL, INSTAGRAM_URL, SHOPEE_URL, WA_NUMBER } from "./config";

export const DEFAULTS = {
  home: {
    title: "Kaos yang bisa hidup.",
    lead: "Zayfen membuat kaos dan merchandise dengan efek AR. Arahkan kamera HP ke desainnya, lalu lihat animasinya muncul.",
    steps: [
      {
        title: "Pilih kaos",
        text: "Pilih desain kaos atau merchandise Zayfen yang kamu suka.",
      },
      {
        title: "Scan desainnya",
        text: "Buka kamera lewat tombol Scan AR, lalu arahkan ke gambar di kaos.",
      },
      {
        title: "Lihat jadi hidup",
        text: "Animasi muncul di atas desain. Kumpulkan semua desain untuk dapat hadiah.",
      },
    ],
    ctaTitle: "Sudah punya kaos Zayfen?",
    ctaText: "Scan desainnya sekarang, tanpa perlu unduh aplikasi.",
  },
  tentang: {
    lead: "Brand kaos dan merchandise yang memadukan desain dengan teknologi AR.",
    paragraphs: [
      {
        text: "Zayfen berawal dari ide sederhana: kaos tidak harus diam. Dengan teknologi augmented reality, gambar di kaos bisa bergerak dan bercerita lewat kamera HP.",
      },
      {
        text: "Setiap produk kami punya desain yang bisa discan. Kamu bisa mengoleksi semua desain dan mendapat hadiah khusus.",
      },
    ],
    values: [
      {
        title: "Desain jadi hidup",
        text: "Setiap desain punya animasi sendiri yang muncul saat discan.",
      },
      {
        title: "Mudah dipakai",
        text: "Tanpa aplikasi tambahan. Cukup kamera HP dan browser.",
      },
      {
        title: "Dibuat dengan teliti",
        text: "Dari desain sampai cetak, kami perhatikan detailnya.",
      },
    ],
  },
  dokumentasi: {
    lead: "Cara memakai Scan AR dan jawaban untuk pertanyaan yang sering muncul.",
    steps: [
      {
        title: "Buka Scan AR",
        text: "Buka link Scan AR atau scan QR yang ada di kaos.",
      },
      {
        title: "Izinkan kamera",
        text: "Tekan Izinkan saat browser meminta akses kamera.",
      },
      {
        title: "Arahkan ke desain",
        text: "Arahkan kamera ke gambar di kaos sampai videonya muncul.",
      },
    ],
    faq: [
      {
        title: "Kamera tidak menyala",
        text: "Pastikan izin kamera diaktifkan di browser dan tidak sedang dipakai aplikasi lain seperti Zoom atau WhatsApp.",
      },
      {
        title: "Video tidak ada suaranya",
        text: "Tekan tombol Nyalakan suara yang muncul di layar.",
      },
      {
        title: "Video hilang saat kamera bergeser",
        text: "Tekan Tahan video agar video tetap tampil, lalu Tutup video kalau sudah selesai.",
      },
      {
        title: "Apakah butuh internet?",
        text: "Ya, video dimuat lewat internet, jadi gunakan WiFi atau kuota yang cukup.",
      },
    ],
  },
  kontak: {
    lead: "Ada pertanyaan soal produk atau pesanan? Hubungi kami.",
    wa: WA_NUMBER,
    instagram: INSTAGRAM_URL,
    shopee: SHOPEE_URL,
    email: EMAIL,
    address: ADDRESS,
  },
};

export const fetchContent = async (key) => {
  if (!supabase) return DEFAULTS[key];
  const { data } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  return { ...DEFAULTS[key], ...(data?.data || {}) };
};

export const saveContent = async (key, data) => {
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, data, updated_at: new Date().toISOString() });
  if (error) throw error;
};

export function useContent(key) {
  const [content, setContent] = useState(DEFAULTS[key]);
  useEffect(() => {
    fetchContent(key).then(setContent);
  }, [key]);
  return content;
}
