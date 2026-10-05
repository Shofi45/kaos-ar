import { useEffect, useRef, useState } from "react";

export default function CameraTest({ onBack }) {
  const videoRef = useRef(null);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let stream;
    const log = (t) => setLines((p) => [...p, t]);

    (async () => {
      log(`Konteks aman (HTTPS/localhost): ${window.isSecureContext}`);
      if (!navigator.mediaDevices?.getUserMedia) {
        log("GAGAL: browser tidak menyediakan kamera. Biasanya karena bukan HTTPS.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        const track = stream.getVideoTracks()[0];
        log(`Kamera terbuka: ${track.label || "(tanpa nama)"}`);
        const v = videoRef.current;
        v.srcObject = stream;
        v.onloadedmetadata = () => log(`Ukuran gambar: ${v.videoWidth}x${v.videoHeight}`);
        await v.play();
        log("Video diputar. Kalau layar masih hitam, kameranya tertutup atau dipakai aplikasi lain.");
      } catch (e) {
        const hint = {
          NotAllowedError: "Izin kamera ditolak/diblokir. Izinkan lewat ikon di kiri alamat, atau di Setelan Windows/HP.",
          NotFoundError: "Tidak ada kamera yang terdeteksi.",
          NotReadableError: "Kamera sedang dipakai aplikasi lain (Zoom, Meet, WhatsApp, dll). Tutup dulu.",
          OverconstrainedError: "Kamera tidak cocok dengan pengaturan yang diminta.",
        }[e.name] || "";
        log(`GAGAL: ${e.name} - ${e.message}`);
        if (hint) log(hint);
      }
    })();

    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="ar-wrap">
      <video ref={videoRef} className="test-video" playsInline muted autoPlay />
      <div className="test-log">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <button onClick={onBack}>Kembali</button>
      </div>
    </div>
  );
}