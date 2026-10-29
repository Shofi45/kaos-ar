// Suara game dibuat langsung dengan WebAudio (tanpa file audio).
const MUTE_KEY = "zf_mute";

let ctx = null;
let master = null;
let musicTimer = null;
let step = 0;

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
}

function tone(
  freq,
  dur,
  { type = "square", vol = 0.18, slide = 0, delay = 0 } = {},
) {
  if (!ctx || !master) return;
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

// Musik latar sederhana: nada pentatonik yang berulang
const MELODY = [
  523, 659, 784, 659, 880, 784, 659, 523, 587, 740, 880, 740, 784, 659, 587,
  523,
];
const BASS = [131, 131, 196, 196, 175, 175, 196, 196];

export function startMusic() {
  if (musicTimer || !ctx) return;
  step = 0;
  musicTimer = setInterval(() => {
    const f = MELODY[step % MELODY.length];
    tone(f, 0.18, { type: "triangle", vol: 0.05 });
    if (step % 2 === 0) {
      tone(BASS[(step / 2) % BASS.length], 0.34, { type: "sine", vol: 0.09 });
    }
    step += 1;
  }, 240);
}

export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}
