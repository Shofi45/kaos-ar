import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { REWARD_CODE, REWARD_TEXT } from "./config";
const BASE = import.meta.env.BASE_URL;
const DEBUG = new URLSearchParams(window.location.search).has("debug");

// path relatif -> ditambah BASE, URL penuh (http...) dipakai apa adanya
const resolve = (p) => (/^https?:\/\//.test(p) ? p : BASE + p);

const makePlane = (url) => {
  const video = document.createElement("video");
  video.src = resolve(url);
  video.loop = true;
  video.muted = false;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.75),
    new THREE.MeshBasicMaterial({ map: new THREE.VideoTexture(video) }),
  );
  video.addEventListener("loadedmetadata", () => {
    const ratio = video.videoHeight / video.videoWidth;
    plane.scale.set(1, ratio / 0.75, 1);
  });
  return { video, plane };
};

export default function ARShirt({ design, onBack }) {
  const boxRef = useRef(null);
  const [found, setFound] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("memulai...");
  const [muted, setMuted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hideReward, setHideReward] = useState(false);
  const [collected, setCollected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("koleksi") || "[]");
    } catch {
      return [];
    }
  });
  const collectedRef = useRef(collected);
  const total = design.slugs ? design.slugs.length : 0;
  const count = collected.filter((s) => design.slugs?.includes(s)).length;

  const collect = (slug) => {
    if (!slug || collectedRef.current.includes(slug)) return;
    const next = [...collectedRef.current, slug];
    collectedRef.current = next;
    setCollected(next);
    try {
      localStorage.setItem("koleksi", JSON.stringify(next));
    } catch {}
  };
  const pinnedRef = useRef(null);
  const pinBoxRef = useRef(null);

  const pin = () => {
    const v = activeRef.current;
    if (!v) return;
    pinnedRef.current = v;
    v.className = "ar-pinned";
    pinBoxRef.current.appendChild(v);
    v.play().catch(() => {});
    setPinned(true);
  };

  const unpin = () => {
    const v = pinnedRef.current;
    if (v) {
      v.pause();
      v.remove();
    }
    pinnedRef.current = null;
    setPinned(false);
  };
  const videosRef = useRef([]);
  const activeRef = useRef(null);
  const mutedRef = useRef(false);

  const enableSound = () => {
    mutedRef.current = false;
    setMuted(false);
    videosRef.current.forEach((v) => {
      v.muted = false;
    });
    activeRef.current?.play().catch(() => {});
  };

  useEffect(() => {
    let mindar;
    const videos = [];
    videosRef.current = videos;
    let timer;
    let cancelled = false;

    const init = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Browser tidak menyediakan kamera. Butuh HTTPS atau localhost.",
          );
        }

        mindar = new MindARThree({
          container: boxRef.current,
          imageTargetSrc: resolve(design.target),
          filterMinCF: 0.0001,
          filterBeta: 100,
          warmupTolerance: 10,
          missTolerance: 10,
        });
        const { renderer, scene, camera } = mindar;

        const urls = design.videos || [design.video];
        urls.forEach((url, i) => {
          const { video, plane } = makePlane(url);
          videos.push(video);
          const anchor = mindar.addAnchor(i);
          anchor.group.add(plane);
          anchor.onTargetFound = () => {
            activeRef.current = video;
            collect(design.slugs?.[i]);
            video.muted = mutedRef.current;
            video.play().catch(() => {
              mutedRef.current = true;
              setMuted(true);
              video.muted = true;
              video.play().catch(() => {});
            });
            setFound(true);
          };
          anchor.onTargetLost = () => {
            if (pinnedRef.current !== video) video.pause();
            setFound(false);
          };
        });

        await mindar.start();
        if (cancelled) {
          mindar.stop();
          return;
        }

        mindar.video.style.zIndex = "0";
        renderer.domElement.style.zIndex = "1";
        renderer.setAnimationLoop(() => renderer.render(scene, camera));

        if (DEBUG) {
          timer = setInterval(() => {
            const v = mindar.video;
            const track = v?.srcObject?.getVideoTracks?.()[0];
            setDebug(
              `aman=${window.isSecureContext} kamera=${v?.videoWidth}x${v?.videoHeight} ` +
                `main=${v ? !v.paused : false} track=${track?.readyState}`,
            );
          }, 500);
        }
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
      videos.forEach((v) => v.pause());
    };
  }, [design]);

  return (
    <div className="ar-wrap">
      <div ref={boxRef} className="ar-box" />
      <div ref={pinBoxRef} className="ar-pinbox" />
      {total > 1 && !error && (
        <div className="ar-collect">
          Koleksi {count}/{total}
        </div>
      )}
      {total > 1 && count >= total && !hideReward && !error && (
        <div className="ar-reward">
          <strong>Selamat!</strong>
          <p>{REWARD_TEXT}</p>
          <code>{REWARD_CODE}</code>
          <button className="small" onClick={() => setHideReward(true)}>
            Tutup
          </button>
        </div>
      )}
      {found && !pinned && !error && (
        <button className="ar-sound ar-pin" onClick={pin}>
          Tahan video
        </button>
      )}
      {pinned && !error && (
        <button className="ar-sound ar-pin" onClick={unpin}>
          Tutup video
        </button>
      )}
      {muted && !error && (
        <button className="ar-sound" onClick={enableSound}>
          Nyalakan suara
        </button>
      )}
      {error && (
        <div className="ar-overlay">
          <p className="ar-error">{error}</p>
          <button onClick={onBack}>Kembali</button>
        </div>
      )}
      {!error && !found && !pinned && (
        <div className="ar-hint">
          Arahkan ke gambar di kaos
          {DEBUG && <div className="ar-debug">{debug}</div>}
        </div>
      )}
    </div>
  );
}
