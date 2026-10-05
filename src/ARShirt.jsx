import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const BASE = import.meta.env.BASE_URL;
const TARGET_SRC = BASE + "targets.mind";
const VIDEO_SRC = BASE + "anim.mp4";

export default function ARShirt({ onBack }) {
  const boxRef = useRef(null);
  const [found, setFound] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("memulai...");

  useEffect(() => {
    let mindar;
    let video;
    let timer;
    let cancelled = false;

    const init = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Browser tidak menyediakan kamera. Butuh HTTPS atau localhost.");
        }

        mindar = new MindARThree({
          container: boxRef.current,
          imageTargetSrc: TARGET_SRC,
        });
        const { renderer, scene, camera } = mindar;

        video = document.createElement("video");
        video.src = VIDEO_SRC;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = "anonymous";

        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 0.75),
          new THREE.MeshBasicMaterial({ map: new THREE.VideoTexture(video) })
        );
        video.addEventListener("loadedmetadata", () => {
          const ratio = video.videoHeight / video.videoWidth;
          plane.scale.set(1, ratio / 0.75, 1);
        });

        const anchor = mindar.addAnchor(0);
        anchor.group.add(plane);
        anchor.onTargetFound = () => { video.play(); setFound(true); };
        anchor.onTargetLost = () => { video.pause(); setFound(false); };

        await mindar.start();
        if (cancelled) { mindar.stop(); return; }

        // pastikan urutan tumpukan: kamera di bawah, objek AR di atas
        mindar.video.style.zIndex = "0";
        renderer.domElement.style.zIndex = "1";

        renderer.setAnimationLoop(() => renderer.render(scene, camera));

        timer = setInterval(() => {
          const v = mindar.video;
          const track = v?.srcObject?.getVideoTracks?.()[0];
          setDebug(
            `aman=${window.isSecureContext} kamera=${v?.videoWidth}x${v?.videoHeight} ` +
            `main=${v ? !v.paused : false} track=${track?.readyState}`
          );
        }, 500);
      } catch (e) {
        console.error(e);
        setError(`${e.name || "Error"}: ${e.message || e}`);
      }
    };
    init();

    return () => {
      cancelled = true;
      clearInterval(timer);
      try {
        mindar?.renderer.setAnimationLoop(null);
        mindar?.stop();
      } catch {}
      video?.pause();
    };
  }, []);

  return (
    <div className="ar-wrap">
      <div ref={boxRef} className="ar-box" />
      {error && (
        <div className="ar-overlay">
          <p className="ar-error">{error}</p>
          <button onClick={onBack}>Kembali</button>
        </div>
      )}
      {!error && !found && (
        <div className="ar-hint">
          Arahkan ke gambar di kaos
          <div className="ar-debug">{debug}</div>
        </div>
      )}
    </div>
  );
}