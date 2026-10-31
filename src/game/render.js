import { GROUND, H, MAX_HP, MAX_ULT, STYLES, W, total } from "./engine";

const THEMES = [
  {
    sky: ["#1a0f33", "#3a1d6e"],
    far: "#2a1650",
    near: "#24133f",
    line: "#a855f7",
  },
  {
    sky: ["#052e2b", "#0f5a52"],
    far: "#0b4a44",
    near: "#073a35",
    line: "#2dd4bf",
  },
  {
    sky: ["#33120f", "#7a2d1f"],
    far: "#5a2018",
    near: "#3d1510",
    line: "#fb923c",
  },
  {
    sky: ["#0b1b3a", "#1d3f7a"],
    far: "#16305f",
    near: "#0f2347",
    line: "#60a5fa",
  },
];
const BODY = { pedang: "#a855f7", tembak: "#38bdf8", tinju: "#f97316" };

const rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const text = (ctx, t, x, y, size, color = "#fff", align = "center") => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(t, x, y);
};

function coin(ctx, x, y, time) {
  const sx = Math.abs(Math.cos(time * 4 + x * 0.05)) * 0.7 + 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(-2, -5, 4, 10);
  ctx.restore();
}

function chest(ctx, it) {
  const x = it.x - 20;
  const y = it.y - 32;
  rr(ctx, x, y + 10, 40, 22, 5);
  ctx.fillStyle = "#92400e";
  ctx.fill();
  rr(ctx, x, y, 40, 16, 8);
  ctx.fillStyle = "#b45309";
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(x, y + 12, 40, 5);
  ctx.fillRect(x + 16, y + 10, 8, 12);
}

function quizBlock(ctx, it, time) {
  const bob = Math.sin(time * 4) * 3;
  ctx.save();
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 14;
  rr(ctx, it.x - 20, it.y - 20 + bob, 40, 40, 9);
  ctx.fillStyle = "#7c3aed";
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e9d5ff";
  rr(ctx, it.x - 20, it.y - 20 + bob, 40, 40, 9);
  ctx.stroke();
  text(ctx, "?", it.x, it.y + 9 + bob, 26);
}

function eyes(ctx, x, y, face, color = "#0b0716") {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + face * 5, y, 5, 0, Math.PI * 2);
  ctx.arc(x + face * 15, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + face * 6.5, y, 2.4, 0, Math.PI * 2);
  ctx.arc(x + face * 16.5, y, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function enemy(ctx, e, time) {
  const flash = e.hurtT > 0 || e.wind > 0;
  ctx.save();
  if (e.dead) {
    ctx.globalAlpha = Math.max(0, e.deathT / 0.5);
  }
  const top = e.y - e.h;

  if (e.type === "grunt") {
    rr(ctx, e.x - e.w / 2, top, e.w, e.h, 14);
    ctx.fillStyle = flash ? "#fff" : "#4ade80";
    ctx.fill();
    eyes(ctx, e.x - 8 + (e.face > 0 ? 6 : -6), top + 18, e.face);
  } else if (e.type === "archer") {
    rr(ctx, e.x - e.w / 2, top, e.w, e.h, 12);
    ctx.fillStyle = flash ? "#fff" : "#fb923c";
    ctx.fill();
    eyes(ctx, e.x - 8 + (e.face > 0 ? 6 : -6), top + 16, e.face);
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      e.x + e.face * 22,
      e.y - 26,
      16,
      e.face > 0 ? -1.2 : Math.PI - 1.2,
      e.face > 0 ? 1.2 : Math.PI + 1.2,
    );
    ctx.stroke();
  } else if (e.type === "bat") {
    const flap = Math.sin(time * 16 + e.x) * 9;
    const cy = e.y - e.h / 2;
    ctx.fillStyle = flash ? "#fff" : "#6366f1";
    ctx.beginPath();
    ctx.ellipse(e.x, cy, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x - 8, cy);
    ctx.lineTo(e.x - 26, cy - 8 - flap);
    ctx.lineTo(e.x - 8, cy + 6);
    ctx.moveTo(e.x + 8, cy);
    ctx.lineTo(e.x + 26, cy - 8 - flap);
    ctx.lineTo(e.x + 8, cy + 6);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(e.x - 5, cy - 3, 3, 3);
    ctx.fillRect(e.x + 2, cy - 3, 3, 3);
  } else {
    rr(ctx, e.x - e.w / 2, top, e.w, e.h, 22);
    ctx.fillStyle = flash ? "#fff" : "#ef4444";
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(e.x - 30, top + 4);
    ctx.lineTo(e.x - 20, top - 16);
    ctx.lineTo(e.x - 8, top + 2);
    ctx.lineTo(e.x, top - 20);
    ctx.lineTo(e.x + 8, top + 2);
    ctx.lineTo(e.x + 20, top - 16);
    ctx.lineTo(e.x + 30, top + 4);
    ctx.closePath();
    ctx.fill();
    eyes(ctx, e.x - 14 + (e.face > 0 ? 8 : -8), top + 36, e.face);
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(e.x - 22, top + 70, 44, 8);
  }

  if (e.wind > 0) text(ctx, "!", e.x, top - 8, 24, "#fde047");
  if (e.stunT > 0) text(ctx, "zZ", e.x, top - 8, 16, "#c4b5fd");
  if (!e.dead && !e.boss && e.hp < e.maxHp) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(e.x - 16, top - 12, 32, 4);
    ctx.fillStyle = "#f87171";
    ctx.fillRect(e.x - 16, top - 12, 32 * (e.hp / e.maxHp), 4);
  }
  ctx.restore();
}

function player(ctx, s, v) {
  const f = s.face;
  const h = s.crouch ? 36 : 60;
  const blink = s.hurtT > 0 && Math.floor(v.time * 16) % 2 === 0;
  const color = BODY[s.style] || BODY.pedang;
  ctx.save();
  ctx.globalAlpha = blink ? 0.35 : 1;

  if (s.rageT > 0) {
    ctx.fillStyle = "rgba(249, 115, 22, 0.25)";
    ctx.beginPath();
    ctx.ellipse(s.px, s.py - h / 2, 30, h / 2 + 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.invT > 0) {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(s.px, s.py - h / 2, 26, h / 2 + 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  rr(ctx, s.px - 14, s.py - h + 14, 28, h - 14, 10);
  ctx.fillStyle = color;
  ctx.fill();

  const hy = s.py - h + 4;
  ctx.save();
  ctx.beginPath();
  ctx.arc(s.px, hy, 16, 0, Math.PI * 2);
  ctx.clip();
  if (v.imgReady) {
    ctx.drawImage(v.img, s.px - 16, hy - 16, 32, 32);
  } else {
    ctx.fillStyle = "#e9d5ff";
    ctx.fillRect(s.px - 16, hy - 16, 32, 32);
  }
  ctx.restore();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s.px, hy, 16, 0, Math.PI * 2);
  ctx.stroke();

  if (s.atkT > 0) {
    const p = 1 - s.atkT / 0.16;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    const a0 = f > 0 ? -1.1 + p * 1.6 : Math.PI + 1.1 - p * 1.6;
    ctx.arc(s.px + f * 8, s.py - h / 2 - 4, 40, a0 - 0.5, a0 + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function bar(ctx, x, y, w, h, frac, color, back = "rgba(0,0,0,0.55)") {
  ctx.fillStyle = back;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(h, fw), h, h / 2);
    ctx.fill();
  }
}

export function draw(ctx, s, v) {
  const { canvasW, canvasH, scale, offX, offY, time } = v;
  const th = THEMES[(s.stage - 1) % THEMES.length];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0b0716";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const shake = v.shake > 0 ? (Math.random() - 0.5) * 10 * v.shake : 0;
  ctx.setTransform(scale, 0, 0, scale, offX + shake, offY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(1, th.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 24; i++) {
    const x = (((i * 83 - s.cam * 0.05) % (W + 20)) + W + 20) % (W + 20);
    const y = 12 + ((i * 47) % 150);
    const tw = 1 + ((Math.sin(time * 2 + i) + 1) / 2) * 1.4;
    ctx.fillRect(x, y, tw, tw);
  }
  ctx.fillStyle = th.far;
  for (let i = 0; i < 5; i++) {
    const x =
      ((((i * 220 - s.cam * 0.25) % (W + 300)) + W + 300) % (W + 300)) - 150;
    ctx.beginPath();
    ctx.ellipse(x, GROUND, 150, 100 + (i % 2) * 24, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = th.near;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = th.line;
  ctx.fillRect(0, GROUND, W, 3);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 12; i++) {
    const x = ((((i * 70 - s.cam) % (W + 70)) + W + 70) % (W + 70)) - 35;
    ctx.fillRect(x, GROUND + 18 + (i % 3) * 12, 30, 3);
  }

  ctx.save();
  ctx.translate(-s.cam, 0);

  s.items.forEach((it) => {
    if (it.x < s.cam - 40 || it.x > s.cam + W + 40) return;
    if (it.type === "coin") coin(ctx, it.x, it.y, time);
    else if (it.type === "chest") chest(ctx, it);
    else if (it.type === "quiz") quizBlock(ctx, it, time);
  });
  s.enemies.forEach((e) => {
    if (e.x > s.cam - 80 && e.x < s.cam + W + 80) enemy(ctx, e, time);
  });
  s.shots.forEach((b) => {
    ctx.fillStyle = b.pierce ? "rgba(96,165,250,0.85)" : "#fde047";
    if (b.w > 100) ctx.fillStyle = "rgba(251,146,60,0.7)";
    rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, Math.min(b.h / 2, 10));
    ctx.fill();
  });
  s.eShots.forEach((b) => {
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  player(ctx, s, v);

  v.floaters.forEach((f) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.t * 1.6));
    text(
      ctx,
      f.text,
      f.x,
      f.y - (0.9 - f.t) * 36,
      f.size || 15,
      f.color || "#fde68a",
    );
    ctx.globalAlpha = 1;
  });
  ctx.restore();

  // ---- papan skor ----
  const hpFrac = s.hp / MAX_HP;
  bar(
    ctx,
    12,
    10,
    190,
    16,
    hpFrac,
    hpFrac > 0.5 ? "#4ade80" : hpFrac > 0.25 ? "#facc15" : "#f87171",
  );
  text(ctx, `NYAWA ${Math.ceil(s.hp)}/${MAX_HP}`, 20, 22, 11, "#fff", "left");
  const full = s.ult >= MAX_ULT;
  bar(ctx, 12, 32, 150, 9, s.ult / MAX_ULT, full ? "#fbbf24" : "#a78bfa");
  if (full && Math.floor(time * 4) % 2 === 0)
    text(ctx, "ULTI SIAP!", 170, 40, 11, "#fde047", "left");

  text(ctx, `STAGE ${s.stage}`, W / 2, 20, 15, "#fff");
  bar(ctx, W / 2 - 60, 27, 120, 5, s.px / s.len, th.line);

  text(ctx, `Koin ${s.coins}`, W - 118, 22, 13, "#fde68a", "right");
  text(ctx, `Skor ${total(s)}`, W - 118, 40, 12, "#e9d5ff", "right");
  if (s.clues.length) {
    text(
      ctx,
      `Harta ${s.cluesFound}/${s.clues.length}`,
      W - 118,
      56,
      11,
      "#fcd34d",
      "right",
    );
  }

  const boss = s.enemies.find((e) => e.boss && !e.dead && e.active);
  if (boss) {
    bar(ctx, W / 2 - 130, 40, 260, 10, boss.hp / boss.maxHp, "#ef4444");
    text(ctx, "BOS", W / 2 - 136, 49, 10, "#fca5a5", "right");
  }
  if (s.toast) text(ctx, s.toast.text, W / 2, 84, 15, "#fff");

  ctx.restore();
}
