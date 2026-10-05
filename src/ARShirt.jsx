import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const BASE = import.meta.env.BASE_URL;
const TARGET_SRC = BASE + "targets.mind";
const VIDEO_SRC = BASE + "anim.mp4";

export default function ARShirt() {
  const boxRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    if (!started) return;
    let mindar;
    let video;
    let cancelled = false;

    const init = async () => {
      try {
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

        const texture = new THREE.VideoTexture(video);
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 0.75),
          new THREE.MeshBasicMaterial({ map: texture }),
        );
        video.addEventListener("loadedmetadata", () => {
          const ratio = video.videoHeight / video.videoWidth;
          plane.scale.set(1, ratio / 0.75, 1);
        });

        const anchor = mindar.addAnchor(0);
        anchor.group.add(plane);
        anchor.onTargetFound = () => {
          video.play();
          setFound(true);
        };
        anchor.onTargetLost = () => {
          video.pause();
          setFound(false);
        };

        await mindar.start();
        const v = mindar.video;
        setDebug(
          `kamera ${v?.videoWidth}x${v?.videoHeight}, paused=${v?.paused}, state=${v?.readyState}`,
        );
        if (cancelled) {
          mindar.stop();
          return;
        }
        renderer.setAnimationLoop(() => renderer.render(scene, camera));
      } catch (e) {
        console.error(e);
        setError(
          "Kamera atau file marker gagal dimuat. Pastikan akses kamera diizinkan dan /targets.mind ada.",
        );
        setStarted(false);
      }
    };
    init();

    return () => {
      cancelled = true;
      try {
        mindar?.renderer.setAnimationLoop(null);
        mindar?.stop();
      } catch {}
      video?.pause();
    };
  }, [started]);

  return (
    <div className="ar-wrap">
      <div ref={boxRef} className="ar-box" />
      {!started && (
        <div className="ar-overlay">
          <h1>AR Kaos</h1>
          <p>Arahkan kamera ke desain di kaos.</p>
          {error && <p className="ar-error">{error}</p>}
          <button
            onClick={() => {
              setError("");
              setStarted(true);
            }}
          >
            Mulai AR
          </button>
        </div>
      )}
           {started && !found && (
        <div className="ar-hint">
          Arahkan ke gambar di kaos
          <div style={{ fontSize: 12, opacity: 0.7 }}>{debug}</div>
        </div>
      )}
    </div>
  );
}
