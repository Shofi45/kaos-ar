// Prerender SEO: jalan setelah `vite build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const SITE = (process.env.SITE_URL || "https://zayfen.id").replace(/\/$/, "");
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const OG_DEFAULT = `${SITE}/og-default.jpg`;

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const cut = (s = "", n = 155) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};
const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const ld = (o) =>
  `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

async function get(table, query) {
  if (!SB_URL || !SB_KEY) return [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return await r.json();
  } catch (e) {
    console.warn(`[prerender] gagal baca ${table}:`, e.message);
    return [];
  }
}

const tpl = readFileSync(join(DIST, "index.html"), "utf8");

function render({
  path,
  title,
  desc,
  image,
  type = "website",
  extra = "",
  body = "",
}) {
  const url = SITE + (path === "/" ? "/" : path);
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="Zayfen" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${esc(image || OG_DEFAULT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    extra,
  ].join("\n    ");

  let html = tpl
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const dir = path === "/" ? DIST : join(DIST, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

const link = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const list = (items) =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.warn("[prerender] dist/index.html tidak ada, dilewati.");
    return;
  }
  const [products, gallery, designs, contentRows] = await Promise.all([
    get("products", "select=*&active=eq.true&order=created_at.desc"),
    get("gallery", "select=*&active=eq.true&order=created_at.desc"),
    get("designs", "select=slug,title,image_url&active=eq.true"),
    get("site_content", "select=key,data"),
  ]);
  const C = Object.fromEntries(contentRows.map((r) => [r.key, r.data || {}]));
  const brand = C.pengaturan?.brand || "Zayfen";
  const home = C.home || {};
  const org = ld({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: SITE,
    logo: OG_DEFAULT,
  });
  const urls = [];

  const pages = [
    {
      path: "/",
      title: `${brand} | Kaos dan Merchandise dengan Efek AR`,
      desc:
        home.lead ||
        "Kaos dan merchandise dengan efek AR. Arahkan kamera HP, lihat desainnya hidup.",
      extra: org,
      body: `<main><h1>${esc(home.title || brand)}</h1><p>${esc(home.lead || "")}</p>${list(
        products
          .slice(0, 8)
          .map((p) => link(`/produk/${encodeURIComponent(p.id)}`, p.name)),
      )}</main>`,
    },
    {
      path: "/katalog",
      title: `Katalog Kaos AR | ${brand}`,
      desc: "Daftar kaos dan merchandise Zayfen dengan efek AR. Pilih desain, scan, lihat animasinya.",
      body: `<main><h1>Katalog</h1>${list(
        products.map((p) =>
          link(
            `/produk/${encodeURIComponent(p.id)}`,
            `${p.name} - ${rupiah(p.price)}`,
          ),
        ),
      )}</main>`,
    },
    {
      path: "/tentang",
      title: `${C.tentang?.title || "Tentang Zayfen"} | ${brand}`,
      desc:
        C.tentang?.lead ||
        "Brand kaos dan merchandise yang memadukan desain dengan teknologi AR.",
      body: `<main><h1>${esc(C.tentang?.title || "Tentang Zayfen")}</h1><p>${esc(C.tentang?.lead || "")}</p>${(
        C.tentang?.paragraphs || []
      )
        .map((p) => `<p>${esc(p.text)}</p>`)
        .join("")}</main>`,
    },
    {
      path: "/dokumentasi",
      title: `${C.dokumentasi?.title || "Panduan Scan AR"} | ${brand}`,
      desc:
        C.dokumentasi?.lead ||
        "Cara memakai Scan AR dan jawaban untuk pertanyaan yang sering muncul.",
      body: `<main><h1>${esc(C.dokumentasi?.title || "Panduan Scan AR")}</h1>${(
        C.dokumentasi?.faq || []
      )
        .map((f) => `<h2>${esc(f.title)}</h2><p>${esc(f.text)}</p>`)
        .join("")}</main>`,
    },
    {
      path: "/galeri",
      title: `${C.galeri?.title || "Galeri"} | ${brand}`,
      desc: C.galeri?.lead || "Cuplikan desain dan momen bersama Zayfen.",
      body: `<main><h1>Galeri</h1>${list(
        gallery.map((g) =>
          link(`/galeri/${encodeURIComponent(g.id)}`, g.title || "Galeri"),
        ),
      )}</main>`,
    },
    {
      path: "/kontak",
      title: `${C.kontak?.title || "Kontak"} | ${brand}`,
      desc:
        C.kontak?.lead ||
        "Ada pertanyaan soal produk atau pesanan? Hubungi Zayfen.",
      body: `<main><h1>Kontak</h1><p>${esc(C.kontak?.lead || "")}</p></main>`,
    },
  ];
  pages.forEach((p) => {
    render(p);
    urls.push(p.path);
  });

  for (const p of products) {
    const path = `/produk/${encodeURIComponent(p.id)}`;
    const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
    const desc = cut(
      p.description ||
        `${p.name}${p.category ? ` (${p.category})` : ""} dari ${brand}, dengan efek AR yang bisa discan lewat kamera HP.`,
    );
    const jsonld = ld({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: desc,
      image: imgs,
      sku: String(p.id),
      category: p.category || undefined,
      brand: { "@type": "Brand", name: brand },
      offers: {
        "@type": "Offer",
        url: SITE + path,
        priceCurrency: "IDR",
        price: Number(p.price),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    });
    render({
      path,
      title: `${p.name} | ${brand}`,
      desc,
      image: imgs[0],
      type: "product",
      extra: jsonld,
      body: `<main><h1>${esc(p.name)}</h1><p>${rupiah(p.price)}</p>${imgs[0] ? `<img src="${esc(imgs[0])}" alt="${esc(p.name)}" />` : ""}<p>${esc(p.description || "")}</p></main>`,
    });
    urls.push(path);
  }

  for (const g of gallery) {
    const path = `/galeri/${encodeURIComponent(g.id)}`;
    const t = g.title || "Galeri";
    render({
      path,
      title: `${t} | ${brand}`,
      desc: cut(`${t}. Cuplikan desain dan momen bersama ${brand}.`),
      image: g.image_url,
      body: `<main><h1>${esc(t)}</h1><img src="${esc(g.image_url)}" alt="${esc(t)}" /></main>`,
    });
    urls.push(path);
  }

  for (const d of designs) {
    const path = `/video/${encodeURIComponent(d.slug)}`;
    const t = d.title || d.slug;
    render({
      path,
      title: `${t} | Video AR ${brand}`,
      desc: cut(
        `Lihat animasi AR desain ${t} dari ${brand}, dan mainkan game-nya.`,
      ),
      image: d.image_url,
      body: `<main><h1>${esc(t)}</h1></main>`,
    });
    urls.push(path);
  }

  const today = new Date().toISOString().slice(0, 10);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${SITE}${u === "/" ? "/" : u}</loc><lastmod>${today}</lastmod></url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;
  writeFileSync(join(DIST, "sitemap.xml"), xml);

  console.log(
    `[prerender] ${urls.length} halaman (${products.length} produk, ${gallery.length} galeri, ${designs.length} video).`,
  );
}

main().catch((e) => console.warn("[prerender] error, build dilanjutkan:", e));
