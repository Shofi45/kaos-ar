import { useEffect, useRef, useState } from "react";

let apiPromise;
const loadApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
};

export default function YouTubePlayer({ id, title }) {
  const boxRef = useRef(null);
  const playerRef = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer;
    setBlocked(false);
    setFailed(false);

    loadApi().then((YT) => {
      if (!alive || !boxRef.current) return;
      const host = document.createElement("div");
      boxRef.current.innerHTML = "";
      boxRef.current.appendChild(host);

      playerRef.current = new YT.Player(host, {
        videoId: id,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          loop: 1,
          playlist: id,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            timer = setTimeout(() => {
              if (alive && e.target.getPlayerState?.() !== 1) setBlocked(true);
            }, 2000);
          },
          onStateChange: (e) => {
            if (e.data === 1) setBlocked(false);
          },
          onError: () => setFailed(true),
        },
      });
    });

    return () => {
      alive = false;
      clearTimeout(timer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* sudah dibersihkan */
      }
    };
  }, [id]);

  return (
    <div className="yt-box" title={title}>
      <div ref={boxRef} className="yt-host" />
      {blocked && !failed && (
        <button
          className="yt-tap"
          onClick={() => {
            playerRef.current?.playVideo();
            setBlocked(false);
          }}
        >
          ▶ Ketuk untuk memutar
        </button>
      )}
      {failed && (
        <p className="yt-fail">
          Video ini tidak bisa diputar di sini.{" "}
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noreferrer"
          >
            Buka di YouTube
          </a>
        </p>
      )}
    </div>
  );
}
