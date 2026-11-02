// Suara game dibuat langsung dengan WebAudio (tanpa file audio).
const MUTE_KEY = "zf_mute";

let ctx = null;
let master = null;
let adventureTrack = null;

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};
let muted = readMuted();

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export const isMuted = () => muted;

export function setMuted(v) {
  muted = v;
  try {
    localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  } catch {
    /* penyimpanan diblokir */
  }
  if (master && ctx)
    master.gain.setTargetAtTime(v ? 0 : 0.6, ctx.currentTime, 0.02);
  if (adventureTrack) adventureTrack.volume = v ? 0 : 0.34;
}

function tone(
  freq,
  dur,
  { type = "square", vol = 0.18, slide = 0, delay = 0 } = {},
) {
  if (!ctx || !master) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) {
    o.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq + slide),
      t + dur,
    );
  }
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export const sfx = {
  punch: () => {
    tone(180, 0.13, { type: "square", slide: -110, vol: 0.3 });
    tone(95, 0.1, { type: "triangle", slide: -35, vol: 0.2, delay: 0.025 });
  },
  slash: () => {
    tone(1120, 0.2, { type: "sawtooth", slide: -900, vol: 0.3 });
    tone(460, 0.13, { type: "triangle", slide: -230, vol: 0.24, delay: 0.025 });
    tone(150, 0.1, { type: "sine", slide: 80, vol: 0.16, delay: 0.06 });
  },
  impact: () => {
    tone(240, 0.14, { type: "sawtooth", slide: -170, vol: 0.3 });
    tone(95, 0.12, { type: "triangle", slide: -45, vol: 0.2, delay: 0.02 });
  },
  kill: () => {
    tone(660, 0.11, { type: "triangle", slide: -300, vol: 0.28 });
    tone(330, 0.18, { type: "square", slide: -180, vol: 0.28, delay: 0.045 });
    tone(120, 0.16, { type: "sine", slide: -55, vol: 0.2, delay: 0.03 });
  },
  skill: (kind = "") => {
    const spin = kind === "spin" || kind === "storm";
    tone(spin ? 420 : 720, 0.24, { type: "sawtooth", slide: spin ? 560 : -520, vol: 0.32 });
    tone(spin ? 180 : 250, 0.2, { type: "triangle", slide: -90, vol: 0.24, delay: 0.035 });
    tone(980, 0.12, { type: "sine", slide: -420, vol: 0.18, delay: 0.06 });
  },
  ult: () => {
    [262, 330, 392, 523, 659, 784].forEach((f, i) =>
      tone(f, 0.2, { type: "sawtooth", vol: 0.27, delay: i * 0.05 }),
    );
    tone(96, 0.38, { type: "sine", slide: -35, vol: 0.25 });
  },
  win: () => {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      tone(f, 0.18, { type: "triangle", vol: 0.22, delay: i * 0.11 }),
    );
  },
  jump: () => tone(300, 0.14, { slide: 340, vol: 0.14 }),
  coin: () => {
    tone(988, 0.07, { vol: 0.14 });
    tone(1319, 0.14, { vol: 0.14, delay: 0.07 });
  },
  hit: () => tone(200, 0.32, { type: "sawtooth", slide: -140, vol: 0.22 }),
  smash: () => {
    tone(520, 0.1, { type: "sawtooth", slide: -300, vol: 0.18 });
    tone(260, 0.16, { type: "square", slide: -150, vol: 0.14, delay: 0.04 });
  },
  power: () => {
    [523, 659, 784].forEach((f, i) =>
      tone(f, 0.1, { vol: 0.14, delay: i * 0.07 }),
    );
  },
  quiz: () => {
    tone(660, 0.1, { type: "triangle", vol: 0.2 });
    tone(880, 0.16, { type: "triangle", vol: 0.2, delay: 0.1 });
  },
  correct: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.12, { type: "triangle", vol: 0.2, delay: i * 0.08 }),
    );
  },
  wrong: () => tone(220, 0.35, { type: "sawtooth", slide: -90, vol: 0.18 }),
  chest: () => {
    [392, 523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.16, { type: "triangle", vol: 0.22, delay: i * 0.1 }),
    );
  },
  over: () => {
    [392, 330, 262, 196].forEach((f, i) =>
      tone(f, 0.22, { type: "triangle", vol: 0.2, delay: i * 0.16 }),
    );
  },
};

export function startMusic() {
  if (typeof Audio === "undefined") return;
  if (!adventureTrack) {
    adventureTrack = new Audio(`${import.meta.env.BASE_URL}game/adventure-theme.mp3`);
    adventureTrack.loop = true;
    adventureTrack.preload = "auto";
    adventureTrack.volume = muted ? 0 : 0.34;
  }
  adventureTrack.volume = muted ? 0 : 0.34;
  if (!adventureTrack.paused) return;
  adventureTrack.play().catch(() => {
    // Browser menolak autoplay: tombol Mulai akan mencoba lagi dari gestur pengguna.
  });
}

export function stopMusic() {
  if (!adventureTrack) return;
  adventureTrack.pause();
  adventureTrack.currentTime = 0;
}
