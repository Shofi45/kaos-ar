import { useEffect, useRef, useState } from "react";
import {
  H,
  MAX_ULT,
  STYLES,
  W,
  answerQuiz,
  closeClue,
  createState,
  nextStage,
  setInput,
  skill,
  startRun,
  step,
  total,
  ultimate,
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
import { exitLandscape, isPortrait } from "./screen";

const BEST_KEY = "zf_best";
const clueKey = (slug) => `zf_clues_${slug}`;
const stageKey = (slug) => `zf_stage_${slug}`;

const readNum = (k, d = 0) => {
  try {
    return Number(localStorage.getItem(k)) || d;
  } catch {
    return d;
  }
};
const writeNum = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
  } catch {
    /* penyimpanan diblokir */
  }
};

const KEYS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  Space: "up",
  ArrowDown: "down",
  KeyS: "down",
};

export default function Game({ design, onClose }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const padActive = useRef(false);
  const btnS1 = useRef(null);
  const btnS2 = useRef(null);
  const btnUlt = useRef(null);
  const sRef = useRef(null);
  const portraitRef = useRef(isPortrait());

  const [ui, setUi] = useState({
    phase: "ready",
    quiz: null,
    clue: null,
    stage: 1,
    maxStage: 1,
    result: null,
  });
  const [sel, setSel] = useState(1);
  const [muted, setMutedState] = useState(isMuted());
  const [portrait, setPortrait] = useState(isPortrait());

  const conf = design.game || {};
  const styleKey = STYLES[conf.power] ? conf.power : "pedang";
  const style = STYLES[styleKey];
  const name = conf.name || design.title || design.slug;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const clues = Array.isArray(conf.clues)
      ? conf.clues
          .map((c) => String(c).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const saved = Math.max(1, readNum(stageKey(design.slug), 1));
    const s = createState({
      style: styleKey,
      clues,
      cluesFound: readNum(clueKey(design.slug)),
      maxStage: saved,
    });
    sRef.current = s;
    setSel(saved);

    const img = new Image();
    const heroImg = new Image();
    const actionSheet = new Image();
    const runFrames = [
      "ninja-run-a.png",
      "ninja-run-b.png",
      "ninja-run-c.png",
      "ninja-run-d.png",
    ].map((name) => {
      const frame = new Image();
      frame.src = `${import.meta.env.BASE_URL}game/${name}`;
      return frame;
    });
    const view = {
      img,
      imgReady: false,
      heroImg,
      heroReady: false,
      actionSheet,
      actionSheetReady: false,
      runFrames,
      runPhase: 0,
      time: 0,
      shake: 0,
      effects: [],
      action: null,
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
    heroImg.onload = () => {
      view.heroReady = true;
    };
    heroImg.src = `${import.meta.env.BASE_URL}game/hero-ninja.png`;
    actionSheet.onload = () => {
      view.actionSheetReady = true;
    };
    actionSheet.src = `${import.meta.env.BASE_URL}game/ninja-action-sheet.png`;

    let raf = 0;
    let last = 0;
    let lastPhase = "";

    const syncUi = () =>
      setUi({
        phase: s.phase,
        quiz: s.quiz,
        clue: s.clue,
        stage: s.stage,
        maxStage: s.maxStage,
        result: {
          kills: s.kills,
          coins: s.coins,
          score: total(s),
          right: s.right,
          bonus: s.bonus,
        },
      });

    const releaseInputs = () => {
      Object.keys(s.input).forEach((k) => {
        s.input[k] = false;
      });
      padActive.current = false;
      if (padRef.current) padRef.current.className = "pad";
    };

    const saveBest = () => {
      const t = total(s);
      if (t > readNum(BEST_KEY)) writeNum(BEST_KEY, t);
    };

    const floater = (text, x, y, color, size) =>
      view.floaters.push({ text, x, y, t: 0.9, color, size });
    const burst = (x, y, count = 12, color = "#ff334b", speed = 130) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.3 + Math.random() * 0.85);
        const life = 0.25 + Math.random() * 0.35;
        view.effects.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 24,
          life,
          max: life,
          size: 1.5 + Math.random() * 3.5,
          color,
        });
      }
    };
    const playAction = (type, duration) => {
      view.action = { type, duration, elapsed: 0, face: s.face };
    };

    const handleEvents = () => {
      for (const e of s.events) {
        switch (e.k) {
          case "start":
            startMusic();
            break;
          case "jump":
            sfx.jump();
            playAction("jump", 0.28);
            break;
          case "slash":
            sfx.slash();
            playAction("slash", 0.34);
            view.shake = Math.max(view.shake, e.n === 3 ? 0.6 : 0.28);
            burst(e.x, e.y, e.n === 3 ? 22 : 12, e.n === 3 ? "#fff0bb" : "#ff334b", e.n === 3 ? 210 : 145);
            view.effects.push({ type: "slash", x: e.x, y: e.y, face: s.face, life: e.n === 3 ? 0.32 : 0.22, max: e.n === 3 ? 0.32 : 0.22, heavy: e.n === 3 });
            break;
          case "punch":
            sfx.punch();
            break;
          case "hit":
            sfx.impact();
            burst(e.x, e.y, 8, "#ffd7a1", 115);
            floater(String(e.n), e.x, e.y, "#fff", 15);
            break;
          case "hurt":
            sfx.hit();
            view.shake = 0.8;
            floater(`-${e.n}`, e.x, e.y, "#f87171", 18);
            break;
          case "kill":
            sfx.kill();
            break;
          case "skill":
            sfx.skill(e.n);
            playAction(e.n === "spin" ? "spin" : "slash", e.n === "spin" ? 0.78 : 0.56);
            if (styleKey === "pedang") {
              burst(e.x + s.face * 28, e.y, 28, "#ff263f", 210);
              view.effects.push({ type: "wave", x: e.x, y: e.y, face: s.face, life: 0.44, max: 0.44 });
            }
            break;
          case "ult":
            sfx.ult();
            playAction("storm", 1.18);
            view.shake = 1;
            if (styleKey === "pedang") burst(e.x, e.y, 55, "#ff243f", 300);
            break;
          case "shake":
            view.shake = 1;
            break;
          case "coin":
            sfx.coin();
            floater("+1", e.x, e.y, "#fde68a", 14);
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
          case "clear":
            sfx.win();
            stopMusic();
            writeNum(stageKey(design.slug), s.maxStage);
            saveBest();
            break;
          case "over":
            sfx.over();
            stopMusic();
            saveBest();
            break;
          default:
            break;
        }
      }
      s.events.length = 0;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      view.canvasW = canvas.width;
      view.canvasH = canvas.height;
      view.scale = Math.min(canvas.width / W, canvas.height / H);
      view.offX = (canvas.width - W * view.scale) / 2;
      view.offY = (canvas.height - H * view.scale) / 2;
      const p = isPortrait();
      portraitRef.current = p;
      setPortrait(p);
    };

    const setCd = (el, v) =>
      el && el.style.setProperty("--cd", String(Math.max(0, Math.min(100, v))));

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0);
      last = now;
      view.time += dt;
      view.shake = Math.max(0, view.shake - dt * 3);
      if (!portraitRef.current) step(s, dt);
      handleEvents();
      if (s.phase === "play") {
        view.runPhase += (Math.min(1.35, Math.abs(s.pvx + s.kb) / 170) * dt * 8);
      }
      if (view.action) {
        view.action.elapsed += dt;
        if (view.action.elapsed >= view.action.duration) view.action = null;
      }
      view.effects.forEach((p) => {
        p.life -= dt;
        if (!p.type) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.97;
          p.vy = p.vy * 0.97 + 90 * dt;
        }
      });
      view.effects = view.effects.filter((p) => p.life > 0);
      view.floaters.forEach((f) => {
        f.t -= dt;
      });
      view.floaters = view.floaters.filter((f) => f.t > 0);
      draw(ctx, s, view);

      const sk = style.skills;
      setCd(btnS1.current, (s.cd[0] / sk[0].cd) * 100);
      setCd(btnS2.current, (s.cd[1] / sk[1].cd) * 100);
      setCd(btnUlt.current, 100 - (s.ult / MAX_ULT) * 100);
      if (btnUlt.current)
        btnUlt.current.classList.toggle("ready", s.ult >= MAX_ULT);

      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        if (s.phase !== "play") releaseInputs();
        syncUi();
      }
      raf = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      if (e.repeat) return;
      const dir = KEYS[e.code];
      if (dir) {
        e.preventDefault();
        initAudio();
        setInput(s, dir, true);
      } else if (e.code === "KeyZ" || e.code === "KeyJ") {
        initAudio();
        setInput(s, "atk", true);
      } else if (e.code === "KeyX" || e.code === "KeyK") {
        initAudio();
        skill(s, 0);
      } else if (e.code === "KeyC" || e.code === "KeyL") {
        initAudio();
        skill(s, 1);
      } else if (e.code === "KeyV" || e.code === "KeyU") {
        initAudio();
        ultimate(s);
      }
    };
    const onKeyUp = (e) => {
      const dir = KEYS[e.code];
      if (dir) setInput(s, dir, false);
      else if (e.code === "KeyZ" || e.code === "KeyJ")
        setInput(s, "atk", false);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopMusic();
      exitLandscape();
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  // ---- kontrol sentuh ----
  const updatePad = (e) => {
    const el = padRef.current;
    const s = sRef.current;
    if (!el || !s) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const t = r.width * 0.14;
    const dirs = { left: dx < -t, right: dx > t, up: dy < -t, down: dy > t };
    Object.entries(dirs).forEach(([k, v]) => setInput(s, k, v));
    el.className = `pad ${Object.keys(dirs)
      .filter((k) => dirs[k])
      .join(" ")}`;
  };
  const padDown = (e) => {
    e.preventDefault();
    initAudio();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    padActive.current = true;
    updatePad(e);
  };
  const padMove = (e) => {
    if (padActive.current) updatePad(e);
  };
  const padUp = () => {
    const s = sRef.current;
    padActive.current = false;
    if (s)
      ["left", "right", "up", "down"].forEach((k) => setInput(s, k, false));
    if (padRef.current) padRef.current.className = "pad";
  };

  const tap = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (sRef.current) fn(sRef.current);
  };
  const atkOn = tap((s) => setInput(s, "atk", true));
  const atkOff = () => sRef.current && setInput(sRef.current, "atk", false);

  const toggleMute = () => {
    initAudio();
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  const s = sRef.current;
  const showControls = ui.phase === "play" && !portrait;
  const r = ui.result || {};

  return (
    <div className={`game${styleKey === "pedang" ? " game-ninja" : ""}`}>
      <canvas ref={canvasRef} />

      {showControls && (
        <div className="controls" onContextMenu={(e) => e.preventDefault()}>
          <div
            ref={padRef}
            className="pad"
            onPointerDown={padDown}
            onPointerMove={padMove}
            onPointerUp={padUp}
            onPointerCancel={padUp}
          >
            <span className="pk up">▲</span>
            <span className="pk left">◀</span>
            <span className="pk right">▶</span>
            <span className="pk down">▼</span>
          </div>

          <button
            className="act atk"
            onPointerDown={atkOn}
            onPointerUp={atkOff}
            onPointerCancel={atkOff}
          >
            <b>{styleKey === "pedang" ? "⚔️" : "👊"}</b>
            <small>{styleKey === "pedang" ? "Tebas" : "Pukul"}</small>
          </button>
          <button
            ref={btnS1}
            className="act s1"
            onPointerDown={tap((st) => skill(st, 0))}
          >
            <b>{style.skills[0].icon}</b>
            <small>{style.skills[0].name}</small>
          </button>
          <button
            ref={btnS2}
            className="act s2"
            onPointerDown={tap((st) => skill(st, 1))}
          >
            <b>{style.skills[1].icon}</b>
            <small>{style.skills[1].name}</small>
          </button>
          <button
            ref={btnUlt}
            className="act ult"
            onPointerDown={tap((st) => ultimate(st))}
          >
            <b>{style.ult.icon}</b>
            <small>Ulti</small>
          </button>
        </div>
      )}

      <button className="game-mute" onClick={toggleMute} aria-label="Suara">
        {muted ? "🔇" : "🔊"}
      </button>
      <button className="game-close" onClick={onClose} aria-label="Tutup game">
        ✕
      </button>

      {portrait && (
        <div className="game-rotate">
          <div className="rotate-icon">📱</div>
          <h2>Putar HP-mu ke mode landscape</h2>
          <p>
            Game ini dimainkan dengan HP dimiringkan. Game berhenti sampai kamu
            memutarnya.
          </p>
        </div>
      )}

      {ui.phase === "ready" && !portrait && (
        <div className="game-modal">
          <div className="game-card wide">
            <small>{style.label}</small>
            <h2>{name}</h2>
            <p>
              Jurus: {style.skills[0].name}, {style.skills[1].name}, dan ulti{" "}
              {style.ult.name}. Kalahkan musuh, jawab soal <b>?</b> untuk
              menambah nyawa, dan kalahkan bos di ujung stage.
            </p>
            {ui.maxStage > 1 && (
              <div className="stage-pick">
                <button
                  onClick={() => setSel((v) => Math.max(1, v - 1))}
                  aria-label="Stage sebelumnya"
                >
                  ‹
                </button>
                <span>Stage {sel}</span>
                <button
                  onClick={() => setSel((v) => Math.min(ui.maxStage, v + 1))}
                  aria-label="Stage berikutnya"
                >
                  ›
                </button>
              </div>
            )}
            <button
              onClick={() => {
                initAudio();
                startMusic();
                if (s) startRun(s, sel, false);
              }}
            >
              Mulai {ui.maxStage > 1 ? `Stage ${sel}` : "petualangan"}
            </button>
          </div>
        </div>
      )}

      {ui.phase === "quiz" && ui.quiz && !portrait && (
        <div className="game-modal">
          <div className="game-card">
            <small>Soal penjumlahan</small>
            <h2>
              {ui.quiz.a} + {ui.quiz.b} = ?
            </h2>
            <div className="game-choices">
              {ui.quiz.choices.map((c) => (
                <button key={c} onClick={() => answerQuiz(s, c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {ui.phase === "clue" && ui.clue && !portrait && (
        <div className="game-modal">
          <div className="game-card">
            <small>
              {ui.clue.final
                ? "Harta karun ditemukan!"
                : `Petunjuk ${ui.clue.index + 1} dari ${ui.clue.total}`}
            </small>
            <h2>{ui.clue.final ? "🎉" : "🗝️"}</h2>
            <p>{ui.clue.text}</p>
            <button onClick={() => closeClue(s)}>Lanjut</button>
          </div>
        </div>
      )}

      {ui.phase === "clear" && !portrait && (
        <div className="game-modal">
          <div className="game-card wide">
            <small>Stage {ui.stage} selesai!</small>
            <h2>🏆</h2>
            <p>
              Skor {r.score} · Koin {r.coins} · Musuh {r.kills} · Soal benar{" "}
              {r.right}
            </p>
            <button onClick={() => {
              initAudio();
              startMusic();
              nextStage(s);
            }}>
              Lanjut ke Stage {ui.stage + 1}
            </button>
            <button className="ghost" onClick={onClose}>
              Keluar
            </button>
          </div>
        </div>
      )}

      {ui.phase === "over" && !portrait && (
        <div className="game-modal">
          <div className="game-card wide">
            <small>Kalah di Stage {ui.stage}</small>
            <h2>💔</h2>
            <p>
              Skor {r.score} · Koin {r.coins} · Musuh {r.kills} · Soal benar{" "}
              {r.right}
            </p>
            <button onClick={() => {
              initAudio();
              startMusic();
              startRun(s, s.stage, false);
            }}>
              Coba lagi
            </button>
            <button className="ghost" onClick={onClose}>
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
