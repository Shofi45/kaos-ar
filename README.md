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
    npm run build
Upload folder `dist` ke Netlify / Vercel (HTTPS otomatis).
