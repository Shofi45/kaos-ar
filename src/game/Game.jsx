import { useEffect, useRef, useState } from "react";
import {
  H,
  W,
  answerQuiz,
  closeClue,
  createState,
  press,
  setHold,
  total,
  usePower,
  step,
} from "./engine";
import { draw } from "./render";
import {
  initAudio,
  isMuted,
  setMuted,
  sfx,
  startMusic,
  stopMusic,
} from "./audio";

const BEST_KEY = "zf_best";
const clueKey = (slug) => `zf_clues_${slug}`;

const readNum = (k) => {
  try {
    return Number(localStorage.getItem(k)) || 0;
  } catch {
    return 0;
  }
};
const writeNum = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
  } catch {
    /* penyimpanan diblokir */
  }
};

export default function Game({ design, onClose }) {
  const canvasRef = useRef(null);
  const powerRef = useRef(null);
  const sRef = useRef(null);
  const [ui, setUi] = useState({ phase: "ready", quiz: null, clue: null });
  const [muted, setMutedState] = useState(isMuted());

  const cfg = design.game || {};
  const isDash = cfg.power === "dash";

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const conf = design.game || {};
    const clues = Array.isArray(conf.clues)
      ? conf.clues
          .map((c) => String(c).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const s = createState({
      power: conf.power,
      clues,
      cluesFound: readNum(clueKey(design.slug)),
    });
    sRef.current = s;

    const img = new Image();
    const view = {
      img,
      imgReady: false,
      time: 0,
      best: readNum(BEST_KEY),
      name: conf.name || design.title || design.slug,
      shake: 0,
      floaters: [],
      canvasW: 0,
      canvasH: 0,
      scale: 1,
      offX: 0,
      offY: 0,
    };
    img.onload = () => {
      view.imgReady = true;
    };
    if (design.image_url) img.src = design.image_url;

    let raf = 0;
    let last = 0;
    let lastPhase = s.phase;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      view.canvasW = canvas.width;
      view.canvasH = canvas.height;
      view.scale = Math.min(canvas.width / W, canvas.height / H);
      view.offX = (canvas.width - W * view.scale) / 2;
      view.offY = (canvas.height - H * view.scale) / 2;
      const btn = powerRef.current;
      if (btn) {
        const cx = (view.offX + (W - 46) * view.scale) / dpr;
        const cy = (view.offY + (H - 70) * view.scale) / dpr;
        btn.style.left = `${cx - 40}px`;
        btn.style.top = `${cy - 40}px`;
      }
    };

    const handleEvents = () => {
      for (const e of s.events) {
        switch (e.k) {
          case "start":
            startMusic();
            break;
          case "jump":
            sfx.jump();
            break;
          case "coin":
            sfx.coin();
            view.floaters.push({ text: "+1", x: e.x + 12, y: e.y, t: 0.9 });
            break;
          case "hit":
            sfx.hit();
            view.shake = 1;
            break;
          case "smash":
            sfx.smash();
            view.floaters.push({ text: "+10", x: e.x + 12, y: e.y, t: 0.9 });
            break;
          case "shield":
            sfx.smash();
            view.floaters.push({
              text: "Tertahan!",
              x: e.x,
              y: e.y,
              t: 0.9,
              color: "#7dd3fc",
            });
            break;
          case "dash":
          case "power":
            sfx.power();
            break;
          case "quiz":
            sfx.quiz();
            break;
          case "chest":
            sfx.chest();
            writeNum(clueKey(design.slug), s.cluesFound);
            break;
          case "correct":
            sfx.correct();
            break;
          case "wrong":
            sfx.wrong();
            break;
          case "over": {
            sfx.over();
            stopMusic();
            const t = total(s);
            if (t > view.best) {
              view.best = t;
              writeNum(BEST_KEY, t);
            }
            break;
          }
          default:
            break;
        }
      }
      s.events.length = 0;
    };

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0);
      last = now;
      view.time += dt;
      view.shake = Math.max(0, view.shake - dt * 3);
      step(s, dt);
      handleEvents();
      view.floaters.forEach((f) => {
        f.t -= dt;
      });
      view.floaters = view.floaters.filter((f) => f.t > 0);
      draw(ctx, s, view);
      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        setUi({ phase: s.phase, quiz: s.quiz, clue: s.clue });
      }
      raf = requestAnimationFrame(loop);
    };

    const onDown = (e) => {
      e.preventDefault();
      initAudio();
      press(s);
      setHold(s, true);
    };
    const onUp = () => setHold(s, false);
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        initAudio();
        press(s);
        setHold(s, true);
      } else if (e.code === "KeyX") {
        usePower(s);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") setHold(s, false);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopMusic();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, [design]);

  const toggleMute = () => {
    initAudio();
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  return (
    <div className="game">
      <canvas ref={canvasRef} />

      {isDash && (
        <button
          ref={powerRef}
          className="game-power"
          aria-label="Pakai kuasa"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            initAudio();
            usePower(sRef.current);
          }}
        />
      )}

      <button className="game-mute" onClick={toggleMute} aria-label="Suara">
        {muted ? "🔇" : "🔊"}
      </button>
      <button className="game-close" onClick={onClose} aria-label="Tutup game">
        ✕
      </button>

      {ui.phase === "quiz" && ui.quiz && (
        <div className="game-modal">
          <div className="game-card">
            <small>Soal penjumlahan</small>
            <h2>
              {ui.quiz.a} + {ui.quiz.b} = ?
            </h2>
            <div className="game-choices">
              {ui.quiz.choices.map((c) => (
                <button key={c} onClick={() => answerQuiz(sRef.current, c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {ui.phase === "clue" && ui.clue && (
        <div className="game-modal">
          <div className="game-card">
            <small>
              {ui.clue.final
                ? "Harta karun ditemukan!"
                : `Petunjuk ${ui.clue.index + 1} dari ${ui.clue.total}`}
            </small>
            <h2>{ui.clue.final ? "🎉" : "🗝️"}</h2>
            <p>{ui.clue.text}</p>
            <button onClick={() => closeClue(sRef.current)}>Lanjut</button>
          </div>
        </div>
      )}
    </div>
  );
}
