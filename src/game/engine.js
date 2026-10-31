// Mesin game aksi: murni logika (tanpa DOM) supaya mudah diuji.
export const W = 640;
export const H = 360;
export const GROUND = 300;
export const GRAVITY = 1600;
export const JUMP_V = -560;
export const MOVE = 170;
export const MAX_HP = 100;
export const MAX_ULT = 100;

export const STYLES = {
  pedang: {
    label: "Pendekar Pedang",
    skills: [
      { id: "slash", name: "Tebasan", cd: 3.5, icon: "⚔️" },
      { id: "spin", name: "Putaran", cd: 6, icon: "🌀" },
    ],
    ult: { id: "storm", name: "Badai", icon: "🌪️" },
  },
  tembak: {
    label: "Penembak",
    skills: [
      { id: "shot", name: "Tembak", cd: 2.2, icon: "🔫" },
      { id: "burst", name: "Tiga Arah", cd: 5, icon: "✨" },
    ],
    ult: { id: "blast", name: "Ledakan", icon: "💥" },
  },
  tinju: {
    label: "Petarung Kuat",
    skills: [
      { id: "slam", name: "Hantam", cd: 5, icon: "🔨" },
      { id: "wave", name: "Gelombang", cd: 4, icon: "🌊" },
    ],
    ult: { id: "rage", name: "Amuk", icon: "🔥" },
  },
};

export const STYLE_OPTIONS = Object.entries(STYLES).map(([value, v]) => ({
  value,
  label: v.label,
}));
// nama lama, supaya form admin yang sudah ada tetap berfungsi
export const POWER_OPTIONS = STYLE_OPTIONS;

const ev = (s, k, x = 0, y = 0, n = 0) => s.events.push({ k, x, y, n });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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

// ---------- kotak tabrakan ----------
const prect = (s) => {
  const h = s.crouch ? 36 : 60;
  return { l: s.px - 14, r: s.px + 14, t: s.py - h, b: s.py };
};
const erect = (e) => ({
  l: e.x - e.w / 2,
  r: e.x + e.w / 2,
  t: e.y - e.h,
  b: e.y,
});
const overlap = (a, b) => a.r > b.l && a.l < b.r && a.b > b.t && a.t < b.b;
const boxHit = (e, x0, x1, y0, y1) =>
  overlap(erect(e), { l: x0, r: x1, t: y0, b: y1 });

const irect = (it) => {
  if (it.type === "chest")
    return { l: it.x - 20, r: it.x + 20, t: it.y - 32, b: it.y };
  const h = it.type === "quiz" ? 20 : 12;
  return { l: it.x - h, r: it.x + h, t: it.y - h, b: it.y + h };
};

// ---------- membuat stage ----------
const ENEMY = {
  grunt: { w: 34, h: 52, hp: 40, spd: 62, dmg: 10 },
  archer: { w: 32, h: 52, hp: 30, spd: 52, dmg: 8 },
  bat: { w: 30, h: 24, hp: 20, spd: 105, dmg: 8 },
  boss: { w: 90, h: 110, hp: 230, spd: 48, dmg: 12 },
};

function makeEnemy(type, n, x, r) {
  const T = ENEMY[type];
  const hp = Math.round(T.hp * (1 + 0.14 * (n - 1)));
  return {
    type,
    x,
    y: type === "bat" ? GROUND - 50 : GROUND,
    w: T.w,
    h: T.h,
    hp,
    maxHp: hp,
    spd: T.spd,
    dmg: Math.round(T.dmg * (1 + 0.09 * (n - 1)) * (n === 1 ? 0.8 : 1)),
    face: -1,
    active: false,
    hurtT: 0,
    stunT: 0,
    cd: 0.6 + r() * 0.8,
    wind: 0,
    t: r() * 6,
    dead: false,
    deathT: 0,
    kbx: 0,
    retreat: 0,
    boss: type === "boss",
    charge: 0,
    chargeCd: 5,
    shootCd: 3,
  };
}

function buildStage(s, n) {
  const r = s.rng;
  s.stage = n;
  s.len = 2200 + Math.min(n, 8) * 260;
  s.enemies = [];
  s.items = [];
  s.shots = [];
  s.eShots = [];

  const count = Math.min(3 + n * 2, 20);
  const span = s.len - 1150;
  for (let i = 0; i < count; i++) {
    const x = 460 + (i / count) * span + r() * 110;
    const p = r();
    let type = "grunt";
    if (n >= 3 && p > 0.72) type = "bat";
    else if (n >= 2 && p > 0.5) type = "archer";
    else if (n === 1 && p > 0.85) type = "archer";
    s.enemies.push(makeEnemy(type, n, x, r));
  }
  s.enemies.push(makeEnemy("boss", n, s.len - 240, r));

  [0.3, 0.62].forEach((f) =>
    s.items.push({ type: "quiz", x: s.len * f, y: GROUND - 70 }),
  );
  if (s.clues.length > s.cluesFound) {
    s.items.push({ type: "chest", x: s.len * 0.46, y: GROUND });
  }
  for (let x = 300; x < s.len - 500; x += 330 + r() * 150) {
    const high = r() < 0.4;
    const y = high ? GROUND - 90 : GROUND - 26;
    for (let i = 0; i < 4; i++)
      s.items.push({ type: "coin", x: x + i * 30, y });
  }
  s.items.sort((a, b) => a.x - b.x);

  s.px = 70;
  s.py = GROUND;
  s.pvx = 0;
  s.pvy = 0;
  s.kb = 0;
  s.face = 1;
  s.onGround = true;
  s.crouch = false;
  s.cam = 0;
  s.arena = false;
  s.clearT = 0;
  s.t = 0;
  s.toast = null;
  s.quiz = null;
  s.clue = null;
  s.jumpBuf = 0;
  s.atkCd = 0;
  s.atkT = 0;
  s.combo = 0;
  s.comboT = 0;
  s.cd = [0, 0];
  s.hurtT = 0;
  s.invT = 0;
  s.rageT = 0;
}

export function createState({
  style = "pedang",
  clues = [],
  cluesFound = 0,
  maxStage = 1,
  rng = Math.random,
} = {}) {
  const s = {
    style: STYLES[style] ? style : "pedang",
    clues,
    cluesFound: Math.min(cluesFound, clues.length),
    maxStage: Math.max(1, maxStage),
    rng,
    phase: "ready",
    events: [],
    overAt: 0,
    input: { left: false, right: false, up: false, down: false, atk: false },
    hp: MAX_HP,
    ult: 0,
    kills: 0,
    coins: 0,
    bonus: 0,
    right: 0,
    quizLevel: 0,
  };
  buildStage(s, 1);
  return s;
}

export const total = (s) => s.kills * 10 + s.coins * 5 + s.bonus;

// carry = lanjut dari stage sebelumnya (nyawa dan skor dibawa)
export function startRun(s, stage, carry = false) {
  const keepHp = carry ? Math.min(MAX_HP, s.hp + 25) : MAX_HP;
  const keepUlt = carry ? s.ult : 0;
  const keep = carry
    ? {
        kills: s.kills,
        coins: s.coins,
        bonus: s.bonus,
        right: s.right,
        quizLevel: s.quizLevel,
      }
    : { kills: 0, coins: 0, bonus: 0, right: 0, quizLevel: 0 };
  buildStage(s, Math.max(1, Math.min(stage, s.maxStage)));
  Object.assign(s, keep);
  s.hp = keepHp;
  s.ult = keepUlt;
  s.input = { left: false, right: false, up: false, down: false, atk: false };
  s.phase = "play";
  ev(s, "start");
}

export const nextStage = (s) => {
  if (s.phase !== "clear") return;
  startRun(s, s.stage + 1, true);
};

// ---------- aksi pemain ----------
function hurtPlayer(s, dmg, fromX) {
  if (s.phase !== "play" || s.hurtT > 0 || s.invT > 0) return false;
  let d = dmg;
  if (s.crouch) d *= 0.5;
  if (s.rageT > 0) d *= 0.65;
  d = Math.max(1, Math.round(d));
  s.hp -= d;
  s.hurtT = 0.7;
  s.kb = (s.px < fromX ? -1 : 1) * 150;
  s.combo = 0;
  ev(s, "hurt", s.px, s.py - 60, d);
  if (s.hp <= 0) {
    s.hp = 0;
    s.phase = "over";
    s.overAt = Date.now();
    ev(s, "over");
  }
  return true;
}

function killEnemy(s, e) {
  e.dead = true;
  e.deathT = 0.5;
  s.kills += 1;
  ev(s, "kill", e.x, e.y - e.h / 2);
  const n = e.boss ? 8 : 1;
  for (let i = 0; i < n; i++) {
    s.items.push({ type: "coin", x: e.x + (i - n / 2) * 14, y: GROUND - 24 });
  }
  if (e.boss) {
    s.eShots = [];
    s.clearT = 1.6;
  }
}

function hitEnemy(s, e, dmg, kb = 0, stun = 0) {
  if (e.dead) return;
  const d = Math.round(
    dmg * (1 + 0.07 * (s.stage - 1)) * (s.rageT > 0 ? 1.6 : 1),
  );
  e.hp -= d;
  e.hurtT = 0.18;
  e.kbx = e.boss ? kb * 0.2 : kb;
  if (stun) e.stunT = Math.max(e.stunT, stun);
  e.active = true;
  s.ult = Math.min(MAX_ULT, s.ult + 4 + d * 0.15);
  ev(s, "hit", e.x, e.y - e.h, d);
  if (e.hp <= 0) killEnemy(s, e);
}

export function attack(s) {
  if (s.phase !== "play" || s.atkCd > 0) return;
  s.atkCd = s.rageT > 0 ? 0.2 : 0.34;
  s.atkT = 0.16;
  s.combo = s.comboT > 0 ? s.combo + 1 : 1;
  s.comboT = 0.7;
  const f = s.face;
  const x0 = f > 0 ? s.px + 6 : s.px - 62;
  const x1 = x0 + 56;
  const big = s.combo % 3 === 0;
  let hit = 0;
  s.enemies.forEach((e) => {
    if (!e.dead && boxHit(e, x0, x1, s.py - 64, s.py - 4)) {
      hitEnemy(s, e, big ? 20 : 12, f * (big ? 180 : 60));
      hit = 1;
    }
  });
  ev(s, "punch", s.px + f * 30, s.py - 34, hit);
}

function area(s, x0, x1, dmg, kb, stun) {
  s.enemies.forEach((e) => {
    if (!e.dead && boxHit(e, x0, x1, s.py - 100, s.py + 6)) {
      hitEnemy(s, e, dmg, e.x < s.px ? -kb : kb, stun);
    }
  });
}

function shoot(s, o) {
  s.shots.push({
    x: s.px + s.face * 20,
    y: s.py - 34,
    vy: 0,
    w: 16,
    h: 12,
    pierce: false,
    life: 1.3,
    hit: new Set(),
    ...o,
  });
}

export function skill(s, i) {
  if (s.phase !== "play" || s.cd[i] > 0) return;
  const def = STYLES[s.style].skills[i];
  s.cd[i] = def.cd * (s.rageT > 0 ? 0.6 : 1);
  const f = s.face;
  ev(s, "skill", s.px, s.py - 30);
  switch (def.id) {
    case "slash": {
      const x0 = s.px;
      const x1 = clamp(s.px + f * 140, 16, s.len - 16);
      s.px = x1;
      s.invT = Math.max(s.invT, 0.25);
      area(s, Math.min(x0, x1) - 20, Math.max(x0, x1) + 20, 34, f * 120, 0);
      break;
    }
    case "spin":
      area(s, s.px - 100, s.px + 100, 30, 160, 0);
      break;
    case "shot":
      shoot(s, { vx: f * 460, dmg: 18 });
      break;
    case "burst":
      [-70, 0, 70].forEach((vy) => shoot(s, { vx: f * 440, vy, dmg: 12 }));
      break;
    case "slam":
      area(s, s.px - 120, s.px + 120, 26, 100, 0.8);
      ev(s, "shake");
      break;
    case "wave":
      shoot(s, {
        vx: f * 320,
        y: s.py - 14,
        w: 44,
        h: 24,
        pierce: true,
        dmg: 22,
        life: 1.6,
      });
      break;
    default:
      break;
  }
}

export function ultimate(s) {
  if (s.phase !== "play" || s.ult < MAX_ULT) return;
  s.ult = 0;
  const def = STYLES[s.style].ult;
  ev(s, "ult", s.px, s.py - 30);
  switch (def.id) {
    case "storm":
      s.invT = Math.max(s.invT, 1.3);
      area(s, s.px - 340, s.px + 340, 85, 200, 0.8);
      ev(s, "shake");
      break;
    case "blast":
      shoot(s, {
        vx: s.face * 520,
        y: s.py - 50,
        w: 220,
        h: 140,
        pierce: true,
        dmg: 90,
        life: 1.1,
      });
      ev(s, "shake");
      break;
    case "rage":
      s.rageT = 7;
      break;
    default:
      break;
  }
}

export function setInput(s, key, v) {
  if (key === "up" && v && !s.input.up) s.jumpBuf = 0.14;
  s.input[key] = v;
}

export function answerQuiz(s, choice) {
  if (s.phase !== "quiz" || !s.quiz) return false;
  const ok = choice === s.quiz.answer;
  const answer = s.quiz.answer;
  s.quizLevel += 1;
  if (ok) {
    const heal = Math.min(30, MAX_HP - s.hp);
    s.hp += heal;
    s.ult = Math.min(MAX_ULT, s.ult + 25);
    s.right += 1;
    s.toast = {
      text: heal > 0 ? `Benar! Nyawa +${heal}` : "Benar! Nyawa sudah penuh",
      t: 1.8,
    };
    ev(s, "correct");
  } else {
    s.toast = { text: `Belum tepat. Jawabannya ${answer}`, t: 2 };
    ev(s, "wrong");
  }
  s.quiz = null;
  s.phase = "play";
  s.invT = Math.max(s.invT, 0.8);
  return ok;
}

export function closeClue(s) {
  if (s.phase !== "clue") return;
  s.clue = null;
  s.phase = "play";
  s.invT = Math.max(s.invT, 0.8);
}

// ---------- musuh ----------
function updateEnemy(s, e, dt) {
  if (e.dead) {
    e.deathT -= dt;
    return;
  }
  e.t += dt;
  e.hurtT = Math.max(0, e.hurtT - dt);
  e.stunT = Math.max(0, e.stunT - dt);
  e.cd = Math.max(0, e.cd - dt);
  e.x = clamp(e.x + e.kbx * dt, 20, s.len - 20);
  e.kbx *= 0.86;

  const dx = s.px - e.x;
  const dist = Math.abs(dx);
  if (!e.active && (dist < 440 || (e.boss && s.arena))) e.active = true;
  if (!e.active || e.stunT > 0) return;
  if (e.wind <= 0) e.face = dx >= 0 ? 1 : -1;
  const near = overlap(erect({ ...e, w: e.w + 24 }), prect(s));

  if (e.type === "grunt") {
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0 && near) hurtPlayer(s, e.dmg, e.x);
    } else if (dist > 36) {
      e.x += e.face * e.spd * dt;
    } else if (e.cd <= 0) {
      e.wind = 0.3;
      e.cd = 1.4;
    }
  } else if (e.type === "archer") {
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        s.eShots.push({
          x: e.x + e.face * 16,
          y: GROUND - 44,
          vx: e.face * 210,
          w: 12,
          h: 10,
          dmg: e.dmg,
          life: 4,
        });
      }
    } else {
      if (dist < 150) e.x -= e.face * e.spd * dt;
      else if (dist > 260) e.x += e.face * e.spd * dt;
      if (e.cd <= 0 && dist < 420) {
        e.wind = 0.4;
        e.cd = 2.2;
      }
    }
  } else if (e.type === "bat") {
    e.y = GROUND - 50 + Math.sin(e.t * 3) * 12;
    if (e.retreat > 0) {
      e.retreat -= dt;
      e.x -= e.face * e.spd * 0.9 * dt;
    } else {
      e.x += e.face * e.spd * dt;
      if (near && e.cd <= 0 && hurtPlayer(s, e.dmg, e.x)) {
        e.cd = 1.2;
        e.retreat = 0.9;
      }
    }
  } else if (e.boss) {
    e.shootCd -= dt;
    e.chargeCd -= dt;
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) e.charge = 0.7;
    } else if (e.charge > 0) {
      e.charge -= dt;
      e.x += e.face * 300 * dt;
      if (near && hurtPlayer(s, Math.round(e.dmg * 1.4), e.x)) e.charge = 0;
    } else {
      if (dist > 70) e.x += e.face * e.spd * dt;
      if (e.chargeCd <= 0) {
        e.wind = 0.6;
        e.chargeCd = 6;
      } else if (e.shootCd <= 0 && dist > 90) {
        [26, 50, 76].forEach((h) =>
          s.eShots.push({
            x: e.x + e.face * 40,
            y: GROUND - h,
            vx: e.face * 220,
            w: 14,
            h: 10,
            dmg: Math.round(e.dmg * 0.7),
            life: 4,
          }),
        );
        e.shootCd = 3.2;
      }
      if (near && e.cd <= 0 && hurtPlayer(s, e.dmg, e.x)) e.cd = 1.1;
    }
  }
}

// ---------- langkah utama ----------
export function step(s, dt) {
  if (s.phase !== "play") return;
  s.t += dt;

  s.atkCd = Math.max(0, s.atkCd - dt);
  s.atkT = Math.max(0, s.atkT - dt);
  s.comboT = Math.max(0, s.comboT - dt);
  s.hurtT = Math.max(0, s.hurtT - dt);
  s.invT = Math.max(0, s.invT - dt);
  s.rageT = Math.max(0, s.rageT - dt);
  s.jumpBuf = Math.max(0, s.jumpBuf - dt);
  s.cd[0] = Math.max(0, s.cd[0] - dt);
  s.cd[1] = Math.max(0, s.cd[1] - dt);
  if (s.toast) {
    s.toast.t -= dt;
    if (s.toast.t <= 0) s.toast = null;
  }

  const inp = s.input;
  s.crouch = inp.down && s.onGround;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir !== 0) s.face = dir;
  const speed = MOVE * (s.rageT > 0 ? 1.3 : 1);
  s.pvx = s.crouch ? 0 : dir * speed;

  if (s.jumpBuf > 0 && s.onGround && !s.crouch) {
    s.pvy = JUMP_V;
    s.onGround = false;
    s.jumpBuf = 0;
    ev(s, "jump");
  }
  if (inp.atk) attack(s);

  s.pvy += GRAVITY * dt;
  s.py += s.pvy * dt;
  if (s.py >= GROUND) {
    s.py = GROUND;
    s.pvy = 0;
    s.onGround = true;
  } else {
    s.onGround = false;
  }
  s.px += (s.pvx + s.kb) * dt;
  s.kb *= 0.85;

  if (!s.arena && s.px > s.len - W + 60) s.arena = true;
  const lo = s.arena ? s.len - W + 16 : 16;
  s.px = clamp(s.px, lo, s.len - 16);
  const target = s.arena ? s.len - W : clamp(s.px - W * 0.4, 0, s.len - W);
  s.cam += (target - s.cam) * Math.min(1, dt * 8);

  s.enemies.forEach((e) => updateEnemy(s, e, dt));
  s.enemies = s.enemies.filter((e) => !(e.dead && e.deathT <= 0));

  // peluru pemain
  for (const b of s.shots) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    const rect = {
      l: b.x - b.w / 2,
      r: b.x + b.w / 2,
      t: b.y - b.h / 2,
      b: b.y + b.h / 2,
    };
    for (const e of s.enemies) {
      if (e.dead || b.hit.has(e) || b.life <= 0) continue;
      if (overlap(rect, erect(e))) {
        b.hit.add(e);
        hitEnemy(s, e, b.dmg, Math.sign(b.vx) * 80);
        if (!b.pierce) b.life = 0;
      }
    }
  }
  s.shots = s.shots.filter((b) => b.life > 0 && b.x > -50 && b.x < s.len + 50);

  // peluru musuh
  for (const b of s.eShots) {
    b.x += b.vx * dt;
    b.life -= dt;
    const rect = {
      l: b.x - b.w / 2,
      r: b.x + b.w / 2,
      t: b.y - b.h / 2,
      b: b.y + b.h / 2,
    };
    if (
      b.life > 0 &&
      overlap(rect, prect(s)) &&
      hurtPlayer(s, b.dmg, b.x - Math.sign(b.vx))
    ) {
      b.life = 0;
    }
  }
  s.eShots = s.eShots.filter(
    (b) => b.life > 0 && b.x > -50 && b.x < s.len + 50,
  );

  // benda yang bisa diambil
  const pr = prect(s);
  for (const it of s.items) {
    if (it.dead || !overlap(pr, irect(it))) continue;
    if (it.type === "coin") {
      it.dead = true;
      s.coins += 1;
      ev(s, "coin", it.x, it.y);
    } else if (it.type === "quiz") {
      it.dead = true;
      s.quiz = makeQuiz(s.stage - 1 + s.quizLevel, s.rng);
      s.phase = "quiz";
      ev(s, "quiz");
      break;
    } else if (it.type === "chest") {
      it.dead = true;
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
    }
  }
  s.items = s.items.filter((it) => !it.dead);

  if (s.phase === "play" && s.clearT > 0) {
    s.clearT -= dt;
    if (s.clearT <= 0) {
      s.phase = "clear";
      s.bonus += s.stage * 100;
      s.maxStage = Math.max(s.maxStage, s.stage + 1);
      ev(s, "clear");
    }
  }
}
