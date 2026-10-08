import { ICON_OPTIONS } from "../site/icons";
import { PAGE_OPTIONS } from "../content";

const t = (key, label, extra = {}) => ({ key, label, type: "text", ...extra });
const a = (key, label, extra = {}) => ({ key, label, type: "area", ...extra });

const titleText = [
  t("title", "Judul", { required: true }),
  a("text", "Isi", { rows: 3, required: true }),
];

const pageText = (extra = []) => ({
  id: "teks",
  label: "Teks halaman",
  kind: "form",
  fields: [
    t("title", "Judul halaman", { required: true }),
    a("lead", "Kalimat pembuka", { rows: 3 }),
    ...extra,
  ],
});

export const META = {
  home: { label: "Beranda", subtitle: "Teks, keunggulan, dan langkah di halaman Beranda" },
  tentang: { label: "Tentang", subtitle: "Cerita brand dan nilai-nilai Zayfen" },
  dokumentasi: { label: "Dokumentasi", subtitle: "Langkah memakai Scan AR dan pertanyaan umum" },
  kontak: { label: "Kontak", subtitle: "Nomor WhatsApp, media sosial, email, dan alamat" },
  pengaturan: { label: "Pengaturan", subtitle: "Nama brand, menu navigasi, footer, dan hadiah koleksi" },
  galeri: { label: "Galeri", subtitle: "Kelola teks halaman dan gambar di Galeri" },
};

export const VIEWS = {
  home: [
    {
      id: "hero",
      label: "Hero",
      kind: "form",
      fields: [
        t("tag", "Label kecil"),
        t("title", "Judul besar", { required: true }),
        a("lead", "Kalimat pembuka", { rows: 3 }),
        t("searchPlaceholder", "Teks kolom cari"),
        t("floatText", "Teks melayang di gambar"),
      ],
    },
    {
      id: "produk",
      label: "Produk pilihan",
      kind: "form",
      note: "Daftar produknya dikelola di menu Produk.",
      fields: [t("featuredTitle", "Judul bagian"), t("featuredNote", "Keterangan singkat")],
    },
    {
      id: "fitur",
      label: "Keunggulan",
      kind: "list",
      heading: t("featuresTitle", "Judul bagian"),
      list: {
        key: "features",
        itemName: "Keunggulan",
        titleKey: "title",
        textKey: "text",
        metaKey: "icon",
        itemFields: [
          t("title", "Judul", { required: true }),
          a("text", "Keterangan", { rows: 2 }),
          { key: "icon", label: "Ikon", type: "select", options: ICON_OPTIONS },
        ],
      },
    },
    {
      id: "langkah",
      label: "Cara kerja",
      kind: "list",
      heading: t("stepsTitle", "Judul bagian"),
      list: { key: "steps", itemName: "Langkah", titleKey: "title", textKey: "text", itemFields: titleText },
    },
    {
      id: "hp",
      label: "Kamera HP",
      kind: "form",
      fields: [t("phoneTitle", "Judul"), a("phoneText", "Isi", { rows: 3 })],
    },
    {
      id: "ajakan",
      label: "Ajakan koleksi",
      kind: "form",
      fields: [t("promoTag", "Label kecil"), t("ctaTitle", "Judul"), a("ctaText", "Isi", { rows: 2 })],
    },
  ],

  tentang: [
    pageText(),
    {
      id: "cerita",
      label: "Cerita brand",
      kind: "list",
      list: {
        key: "paragraphs",
        itemName: "Paragraf",
        titleKey: "text",
        itemFields: [a("text", "Isi paragraf", { rows: 4, required: true })],
      },
    },
    {
      id: "nilai",
      label: "Nilai brand",
      kind: "list",
      heading: t("valuesTitle", "Judul bagian"),
      list: { key: "values", itemName: "Nilai", titleKey: "title", textKey: "text", itemFields: titleText },
    },
  ],

  dokumentasi: [
    pageText(),
    {
      id: "langkah",
      label: "Langkah singkat",
      kind: "list",
      heading: t("stepsTitle", "Judul bagian"),
      list: { key: "steps", itemName: "Langkah", titleKey: "title", textKey: "text", itemFields: titleText },
    },
    {
      id: "faq",
      label: "Pertanyaan umum",
      kind: "list",
      heading: t("faqTitle", "Judul bagian"),
      list: {
        key: "faq",
        itemName: "Pertanyaan",
        titleKey: "title",
        textKey: "text",
        itemFields: [
          t("title", "Pertanyaan", { required: true }),
          a("text", "Jawaban", { rows: 3, required: true }),
        ],
      },
    },
  ],

  kontak: [
    pageText(),
    {
      id: "kontak",
      label: "Cara dihubungi",
      kind: "form",
      note: "Kolom yang dikosongkan tidak ditampilkan di situs.",
      fields: [
        t("wa", "Nomor WhatsApp", { check: "digits", inputMode: "numeric", placeholder: "6281234567890", hint: "Awali dengan 62, tanpa + atau spasi." }),
        t("instagram", "Link Instagram", { check: "url", placeholder: "https://instagram.com/akunmu" }),
        t("shopee", "Link toko Shopee", { check: "url", placeholder: "https://shopee.co.id/tokomu" }),
        t("email", "Email", { check: "email", inputMode: "email" }),
        a("address", "Alamat", { rows: 3 }),
      ],
    },
  ],

  galeri: [
    {
      id: "teks",
      label: "Teks halaman",
      kind: "form",
      fields: [
        t("title", "Judul halaman", { required: true }),
        a("lead", "Kalimat pembuka", { rows: 2 }),
        t("emptyText", "Teks saat belum ada gambar"),
      ],
    },
  ],

  pengaturan: [
    {
      id: "brand",
      label: "Brand dan footer",
      kind: "form",
      fields: [
        t("brand", "Nama brand (logo)", { required: true }),
        t("navButton", "Teks tombol Scan AR di menu"),
        a("footerText", "Deskripsi singkat di footer", { rows: 3 }),
        t("copyright", "Teks hak cipta", { hint: "Tahun ditambahkan otomatis di depannya." }),
      ],
    },
    {
      id: "menu",
      label: "Menu navigasi",
      kind: "list",
      note: "Urutan di sini menjadi urutan menu di situs.",
      list: {
        key: "menu",
        itemName: "Menu",
        min: 1,
        titleKey: "label",
        metaKey: "path",
        itemFields: [
          t("label", "Nama menu", { required: true }),
          { key: "path", label: "Halaman tujuan", type: "select", options: PAGE_OPTIONS },
        ],
      },
    },
    {
      id: "hadiah",
      label: "Hadiah koleksi",
      kind: "form",
      note: "Kode ini tampil ke pembeli yang mengoleksi semua desain. Kode di situs bersifat publik, jadi jangan pakai kode bernilai besar.",
      fields: [
        t("rewardCode", "Kode hadiah", { required: true }),
        a("rewardText", "Pesan hadiah", { rows: 2 }),
      ],
    },
  ],
};