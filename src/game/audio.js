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

function noiseSweep(
  dur,
  { start = 2600, end = 500, vol = 0.28, filterType = "bandpass", q = 0.9, delay = 0 } = {},
) {
  if (!ctx || !master) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime + delay;
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    low = low * 0.72 + white * 0.28;
    data[i] = low;
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = filterType;
  filter.frequency.setValueAtTime(start, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, end), t + dur);
  filter.Q.setValueAtTime(q, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(vol, t + Math.min(0.018, dur * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(t);
  source.stop(t + dur + 0.02);
}

export const sfx = {
  punch: () => {
    noiseSweep(0.1, { start: 620, end: 130, vol: 0.3, filterType: "lowpass", q: 0.6 });
    tone(92, 0.12, { type: "sine", slide: -34, vol: 0.24 });
  },
  slash: () => {
    noiseSweep(0.19, { start: 4200, end: 780, vol: 0.3, filterType: "highpass", q: 0.7 });
    tone(1480, 0.11, { type: "sine", slide: -650, vol: 0.1, delay: 0.045 });
    tone(820, 0.08, { type: "triangle", slide: -280, vol: 0.055, delay: 0.07 });
  },
  impact: () => {
    noiseSweep(0.12, { start: 950, end: 180, vol: 0.26, filterType: "lowpass", q: 0.75 });
    tone(78, 0.15, { type: "sine", slide: -28, vol: 0.26 });
  },
  kill: () => {
    noiseSweep(0.16, { start: 820, end: 140, vol: 0.2, filterType: "lowpass" });
    tone(920, 0.22, { type: "sine", slide: -160, vol: 0.13, delay: 0.035 });
    tone(116, 0.2, { type: "sine", slide: -38, vol: 0.22, delay: 0.025 });
  },
  skill: (kind = "") => {
    if (kind === "spin") {
      noiseSweep(0.66, { start: 720, end: 3100, vol: 0.32, filterType: "bandpass", q: 1.1 });
      tone(1120, 0.14, { type: "sine", slide: -420, vol: 0.09, delay: 0.48 });
    } else {
      noiseSweep(0.32, { start: 3400, end: 480, vol: 0.36, filterType: "highpass", q: 0.85 });
      tone(1320, 0.16, { type: "sine", slide: -730, vol: 0.11, delay: 0.08 });
      tone(84, 0.13, { type: "sine", slide: -22, vol: 0.12, delay: 0.18 });
    }
  },
  ult: () => {
    noiseSweep(0.78, { start: 180, end: 2200, vol: 0.38, filterType: "lowpass", q: 0.65 });
    tone(68, 0.56, { type: "sine", slide: -26, vol: 0.28 });
    tone(520, 0.36, { type: "triangle", slide: 180, vol: 0.1, delay: 0.12 });
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
