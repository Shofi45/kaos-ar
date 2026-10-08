import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  ADDRESS,
  EMAIL,
  INSTAGRAM_URL,
  MENU,
  REWARD_CODE,
  REWARD_TEXT,
  SHOPEE_URL,
  WA_NUMBER,
} from "./config";

// Halaman yang benar-benar ada di situs (dipakai pilihan menu di admin)
export const PAGE_OPTIONS = MENU.map((m) => ({
  value: m.path,
  label: m.label,
}));

export const DEFAULTS = {
  home: {
    tag: "KAOS DENGAN EFEK AR",
    title: "Kaos yang bisa hidup.",
    lead: "Zayfen membuat kaos dan merchandise dengan efek AR. Arahkan kamera HP ke desainnya, lalu lihat animasinya muncul.",
    searchPlaceholder: "Cari kaos atau merchandise...",
    floatText: "Scan, lalu lihat hidup",
    featuredTitle: "Produk pilihan",
    featuredNote: "Pilihan terbaru dari Zayfen.",
    featuresTitle: "Kenapa Zayfen?",
    features: [
      { title: "Efek AR", text: "Desain di kaos bergerak lewat kamera HP.", icon: "ar" },
      { title: "Tanpa aplikasi", text: "Cukup browser, tidak perlu unduh apa pun.", icon: "phone" },
      { title: "Koleksi dan hadiah", text: "Scan semua desain, dapatkan kode diskon.", icon: "star" },
      { title: "Beli di Shopee", text: "Pesanan aman lewat toko resmi kami.", icon: "bag" },
    ],
    stepsTitle: "Cara kerja",
    steps: [
      { title: "Pilih kaos", text: "Pilih desain kaos atau merchandise Zayfen yang kamu suka." },
      { title: "Scan desainnya", text: "Buka kamera lewat tombol Scan AR, lalu arahkan ke gambar di kaos." },
      { title: "Lihat jadi hidup", text: "Animasi muncul di atas desain. Kumpulkan semua desain untuk dapat hadiah." },
    ],
    phoneTitle: "Langsung dari kamera HP",
    phoneText:
      "Scan QR atau buka link Scan AR, izinkan kamera, lalu arahkan ke desain di kaos. Animasinya muncul tanpa unduh aplikasi.",
    promoTag: "KOLEKSI DESAIN",
    ctaTitle: "Sudah punya kaos Zayfen?",
    ctaText: "Scan desainnya sekarang, tanpa perlu unduh aplikasi.",
  },
  tentang: {
    title: "Tentang Zayfen",
    lead: "Brand kaos dan merchandise yang memadukan desain dengan teknologi AR.",
    paragraphs: [
      { text: "Zayfen berawal dari ide sederhana: kaos tidak harus diam. Dengan teknologi augmented reality, gambar di kaos bisa bergerak dan bercerita lewat kamera HP." },
      { text: "Setiap produk kami punya desain yang bisa discan. Kamu bisa mengoleksi semua desain dan mendapat hadiah khusus." },
    ],
    valuesTitle: "Yang kami pegang",
    values: [
      { title: "Desain jadi hidup", text: "Setiap desain punya animasi sendiri yang muncul saat discan." },
      { title: "Mudah dipakai", text: "Tanpa aplikasi tambahan. Cukup kamera HP dan browser." },
      { title: "Dibuat dengan teliti", text: "Dari desain sampai cetak, kami perhatikan detailnya." },
    ],
  },
  dokumentasi: {
    title: "Panduan Scan AR",
    lead: "Cara memakai Scan AR dan jawaban untuk pertanyaan yang sering muncul.",
    stepsTitle: "Langkah singkat",
    steps: [
      { title: "Buka Scan AR", text: "Buka link Scan AR atau scan QR yang ada di kaos." },
      { title: "Izinkan kamera", text: "Tekan Izinkan saat browser meminta akses kamera." },
      { title: "Arahkan ke desain", text: "Arahkan kamera ke gambar di kaos sampai videonya muncul." },
    ],
    faqTitle: "Pertanyaan umum",
    faq: [
      { title: "Kamera tidak menyala", text: "Pastikan izin kamera diaktifkan di browser dan tidak sedang dipakai aplikasi lain seperti Zoom atau WhatsApp." },
      { title: "Video tidak ada suaranya", text: "Tekan tombol Nyalakan suara yang muncul di layar." },
      { title: "Video hilang saat kamera bergeser", text: "Tekan Tahan video agar video tetap tampil, lalu Tutup video kalau sudah selesai." },
      { title: "Apakah butuh internet?", text: "Ya, video dimuat lewat internet, jadi gunakan WiFi atau kuota yang cukup." },
    ],
  },
  kontak: {
    title: "Kontak",
    lead: "Ada pertanyaan soal produk atau pesanan? Hubungi kami.",
    wa: WA_NUMBER,
    instagram: INSTAGRAM_URL,
    shopee: SHOPEE_URL,
    email: EMAIL,
    address: ADDRESS,
  },
  galeri: {
    title: "Galeri",
    lead: "Cuplikan desain dan momen bersama Zayfen.",
    emptyText: "Belum ada gambar.",
  },
  kategori: {
    list: [],
  },
  pengaturan: {
    brand: "Zayfen",
    footerText:
      "Kaos dan merchandise dengan efek AR. Arahkan kamera, lihat desainnya hidup.",
    copyright: "Zayfen. Semua hak dilindungi.",
    navButton: "Scan AR",
    menu: MENU.map((m) => ({ label: m.label, path: m.path })),
    rewardCode: REWARD_CODE,
    rewardText: REWARD_TEXT,
  },
};

const cache = new Map();

export const fetchContent = (key, fresh = false) => {
  if (!fresh && cache.has(key)) return cache.get(key);
  const p = (async () => {
    if (!supabase) return DEFAULTS[key];
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", key)
      .maybeSingle();
    if (error) cache.delete(key);
    return { ...DEFAULTS[key], ...(data?.data || {}) };
  })();
  cache.set(key, p);
  return p;
};

export const saveContent = async (key, data) => {
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, data, updated_at: new Date().toISOString() });
  if (error) throw error;
  cache.delete(key);
};

export function useContent(key) {
  const [content, setContent] = useState(DEFAULTS[key]);
  useEffect(() => {
    let alive = true;
    fetchContent(key).then((c) => alive && setContent(c));
    return () => {
      alive = false;
    };
  }, [key]);
  return content;
}