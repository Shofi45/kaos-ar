# AR Kaos

Image-tracking AR (MindAR + three.js + React). Desain kaos jadi marker, video muncul di atasnya.

## Jalankan
    npm install
    npm run dev

Buka alamat `https://192.168.x.x:5173` dari HP (satu WiFi). Abaikan peringatan sertifikat (lokal saja).

## Tes dengan contoh
`public/marker-contoh.png` adalah marker bawaan (kartu contoh MindAR). Tampilkan di layar laptop,
arahkan kamera HP, video uji muncul.

## Ganti dengan desainmu
1. Compile desain di MindAR image targets compiler (cari "MindAR image targets compiler"), unduh `targets.mind`.
2. Timpa `public/targets.mind`.
3. Timpa `public/anim.mp4` (H.264, 5-10 detik, ringan).
4. Atur `TARGET_SRC` / `VIDEO_SRC` di `src/ARShirt.jsx` kalau namanya beda.

## Deploy
Untuk Cloudflare Pages:
1. Set build command ke `npm run build` dan output directory ke `dist`.
2. Pastikan `public/_redirects` ikut ter-deploy. Aturan SPA di dalamnya mengarahkan URL seperti `/katalog` ke `index.html`, agar React bisa menampilkan route tersebut.
