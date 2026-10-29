// Mesin game: murni logika (tanpa DOM) supaya mudah diuji.
export const W = 360;
export const H = 640;
export const GROUND = 520;
export const GRAVITY = 1800;
export const JUMP_V = -720;
export const SIZE = 56;
export const PX = 70;
export const MAX_HEARTS = 3;

export const POWER_INFO = {
  double: {
    label: "Lompat ganda",
    how: "Ketuk lagi saat di udara untuk lompat kedua.",
  },
  glide: {
    label: "Melayang",
    how: "Tahan layar saat jatuh untuk melayang pelan.",
  },
  dash: {
    label: "Tebasan",
    how: "Ketuk tombol kuasa untuk menebas semua rintangan sebentar.",
  },
  shield: {
    label: "Perisai",
    how: "Menahan satu tabrakan, lalu pulih sendiri.",
  },
};

export const POWER_OPTIONS = Object.entries(POWER_INFO).map(([value, v]) => ({
  value,
  label: v.label,
}));

const ev = (s, k, x = 0, y = 0) => s.events.push({ k, x, y });

export function makeQuiz(level, rng = Math.random) {
  const lo = level < 2 ? 1 : level < 5 ? 5 : 10;
  const hi = level < 2 ? 9 : level < 5 ? 20 : 50;
  const pick = () => lo + Math.floor(rng() * (hi - lo + 1));
  const a = pick();
  const b = pick();
  const answer = a + b;
  const spread = level < 2 ? 4 : level < 5 ? 8 : 12;

  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 300) {
    const d = 1 + Math.floor(rng() * spread);
    const c = answer + (rng() < 0.5 ? -d : d);
    if (c >= 1) set.add(c);
  }
  let extra = 1;
  while (set.size < 4) set.add(answer + 10 + extra++);

  const choices = [...set];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { a, b, answer, choices };
}

export function createState({
  power = "double",
  clues = [],
  cluesFound = 0,
  rng = Math.random,
} = {}) {
  const s = {
    power: POWER_INFO[power] ? power : "double",
    clues,
    cluesFound: Math.min(cluesFound, clues.length),
    rng,
    phase: "ready",
    events: [],
    overAt: 0,
    holding: false,
  };
  freshRun(s, false);
  s.phase = "ready";
  return s;
}

function freshRun(s, play = true) {
  s.phase = play ? "play" : s.phase;
  s.t = 0;
  s.dist = 0;
  s.bonus = 0;
  s.coins = 0;
  s.right = 0;
  s.hearts = MAX_HEARTS;
  s.y = GROUND - SIZE;
  s.vy = 0;
  s.jumps = 0;
  s.hurtT = 0;
  s.dashT = 0;
  s.dashCd = 0;
  s.shieldReady = s.power === "shield";
  s.shieldCd = 0;
  s.speed = 260;
  s.things = [];
  s.gap = 260;
  s.quizT = 14;
  s.chestT = 20;
  s.quizLevel = 0;
  s.quiz = null;
  s.clue = null;
  s.toast = null;
}

export const total = (s) => Math.floor(s.dist / 10) + s.coins * 5 + s.bonus;

function spawn(s) {
  const r = s.rng;
  const x = W + 30;

  let kind;
  if (s.quizT <= 0) kind = "quiz";
  else if (s.chestT <= 0 && s.clues.length > s.cluesFound) kind = "chest";
  else {
    const p = r();
    kind = p < 0.5 ? "rock" : p < 0.66 ? "spike" : p < 0.8 ? "bird" : "coins";
  }

  const clearGap = Math.max(250, s.speed * 0.95) + r() * 110;
  const softGap = 200 + r() * 80;

  if (kind === "rock") {
    const w = 30 + r() * 26;
    const h = 38 + r() * 44;
    s.things.push({ type: "rock", x, y: GROUND - h, w, h });
    const cx = x + w / 2;
    [
      [-30, 52],
      [0, 76],
      [30, 52],
    ].forEach(([dx, up]) => {
      s.things.push({
        type: "coin",
        x: cx + dx - 12,
        y: GROUND - h - up,
        w: 24,
        h: 24,
      });
    });
    s.gap = clearGap;
  } else if (kind === "spike") {
    s.things.push({ type: "spike", x, y: GROUND - 26, w: 34, h: 26 });
    s.gap = clearGap;
  } else if (kind === "bird") {
    const h = 26;
    const bottom = GROUND - 60 - r() * 30;
    s.things.push({ type: "bird", x, y: bottom - h, w: 42, h, vx: -40 });
    s.gap = clearGap;
  } else if (kind === "coins") {
    const high = r() < 0.5;
    const y = high ? GROUND - 120 : GROUND - 40;
    for (let i = 0; i < 5; i++) {
      s.things.push({ type: "coin", x: x + i * 32, y, w: 24, h: 24 });
    }
    s.gap = softGap + 80;
  } else if (kind === "quiz") {
    s.things.push({ type: "quiz", x, y: GROUND - 150, w: 44, h: 44 });
    s.quizT = 16 + r() * 8;
    s.gap = softGap;
  } else {
    s.things.push({ type: "chest", x, y: GROUND - 36, w: 44, h: 36 });
    s.chestT = 22 + r() * 10;
    s.gap = softGap;
  }
}

export function step(s, dt) {
  if (s.phase !== "play") return;
  s.t += dt;

  const mul = s.dashT > 0 ? 1.8 : 1;
  const move = s.speed * mul * dt;

  s.vy += GRAVITY * dt;
  if (s.power === "glide" && s.holding && s.vy > 170 && s.y < GROUND - SIZE) {
    s.vy = 170;
  }
  s.y += s.vy * dt;
  if (s.y >= GROUND - SIZE) {
    s.y = GROUND - SIZE;
    s.vy = 0;
    s.jumps = 0;
  }

  s.hurtT = Math.max(0, s.hurtT - dt);
  s.dashT = Math.max(0, s.dashT - dt);
  s.dashCd = Math.max(0, s.dashCd - dt);
  if (s.toast) {
    s.toast.t -= dt;
    if (s.toast.t <= 0) s.toast = null;
  }
  if (s.power === "shield" && !s.shieldReady) {
    s.shieldCd -= dt;
    if (s.shieldCd <= 0) {
      s.shieldReady = true;
      ev(s, "power");
    }
  }

  s.speed = Math.min(520, s.speed + 6 * dt);
  s.dist += move;

  s.gap -= move;
  s.quizT -= dt;
  s.chestT -= dt;
  if (s.gap <= 0) spawn(s);

  s.things.forEach((t) => {
    t.x -= move;
    if (t.vx) t.x += t.vx * dt;
  });

  const px1 = PX + 8;
  const px2 = PX + SIZE - 8;
  const py1 = s.y + 8;
  const py2 = s.y + SIZE;

  for (const t of s.things) {
    if (t.dead) continue;
    const hit = px2 > t.x && px1 < t.x + t.w && py2 > t.y && py1 < t.y + t.h;
    if (!hit) continue;

    if (t.type === "coin") {
      t.dead = true;
      s.coins += 1;
      ev(s, "coin", t.x, t.y);
    } else if (t.type === "quiz") {
      t.dead = true;
      s.quiz = makeQuiz(s.quizLevel, s.rng);
      s.phase = "quiz";
      ev(s, "quiz");
      break;
    } else if (t.type === "chest") {
      t.dead = true;
      const idx = s.cluesFound;
      s.clue = {
        index: idx,
        total: s.clues.length,
        text: s.clues[idx],
        final: idx === s.clues.length - 1,
      };
      s.cluesFound += 1;
      s.coins += 6;
      s.phase = "clue";
      ev(s, "chest");
      break;
    } else {
      // rintangan: rock, spike, bird
      if (s.dashT > 0) {
        t.dead = true;
        s.bonus += 10;
        ev(s, "smash", t.x, t.y);
      } else if (s.hurtT > 0) {
        // sedang kebal sesaat
      } else if (s.power === "shield" && s.shieldReady) {
        s.shieldReady = false;
        s.shieldCd = 12;
        t.dead = true;
        ev(s, "shield", t.x, t.y);
      } else {
        s.hearts -= 1;
        s.hurtT = 1.3;
        ev(s, "hit", t.x, t.y);
        if (s.hearts <= 0) {
          s.phase = "over";
          s.overAt = Date.now();
          ev(s, "over");
          break;
        }
      }
    }
  }

  s.things = s.things.filter((t) => !t.dead && t.x + t.w > -40);
}

// Ketukan layar: mulai, lompat, atau main lagi
export function press(s) {
  if (s.phase === "ready") {
    freshRun(s, true);
    ev(s, "start");
    return;
  }
  if (s.phase === "over") {
    if (Date.now() - s.overAt < 500) return;
    freshRun(s, true);
    ev(s, "start");
    return;
  }
  if (s.phase !== "play") return;
  const max = s.power === "double" ? 2 : 1;
  if (s.jumps < max) {
    s.vy = JUMP_V;
    s.jumps += 1;
    ev(s, "jump");
  }
}

export const setHold = (s, v) => {
  s.holding = v;
};

export function usePower(s) {
  if (s.phase !== "play") return;
  if (s.power === "dash" && s.dashCd <= 0 && s.dashT <= 0) {
    s.dashT = 0.9;
    s.dashCd = 7;
    ev(s, "dash");
  }
}

export function answerQuiz(s, choice) {
  if (s.phase !== "quiz" || !s.quiz) return false;
  const ok = choice === s.quiz.answer;
  const answer = s.quiz.answer;
  s.quizLevel += 1;
  if (ok) {
    s.coins += 5;
    s.right += 1;
    const healed = s.hearts < MAX_HEARTS;
    if (healed) s.hearts += 1;
    s.toast = {
      text: healed ? "Benar! +5 koin, +1 nyawa" : "Benar! +5 koin",
      t: 1.8,
    };
    ev(s, "correct");
  } else {
    s.coins = Math.max(0, s.coins - 2);
    s.toast = { text: `Belum tepat. Jawabannya ${answer}`, t: 2 };
    ev(s, "wrong");
  }
  s.quiz = null;
  s.phase = "play";
  s.hurtT = Math.max(s.hurtT, 1);
  return ok;
}

export function closeClue(s) {
  if (s.phase !== "clue") return;
  s.clue = null;
  s.phase = "play";
  s.hurtT = Math.max(s.hurtT, 1);
}
