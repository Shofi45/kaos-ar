import { GROUND, H, MAX_HP, MAX_ULT, STYLES, W, total } from "./engine";

const THEMES = [
  {
    sky: ["#090d1b", "#35111d"],
    far: "#211322",
    near: "#160d16",
    line: "#df3348",
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
// Batas siluet di tiap sel aksi (koordinat relatif terhadap sel 288×384).
const ACTION_BOUNDS = {
  4: [19, 117, 269, 267],
  5: [0, 145, 288, 239],
  6: [0, 143, 288, 241],
  7: [0, 86, 275, 298],
};

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
  const moving = Math.abs(s.pvx) > 8;
  const action = v.action;
  const actionP = action ? Math.min(1, action.elapsed / action.duration) : 0;
  // Ninja tidak diberi bob/lift dekoratif: kaki mengikuti posisi fisik s.py.
  const bob = s.style === "pedang" ? 0 : s.onGround ? Math.sin(v.time * (moving ? 8 : 2.4)) * (moving ? 1.25 : 0.6) : 0;
  ctx.save();
  ctx.globalAlpha = blink ? 0.45 : 1;

  if (s.rageT > 0 || (s.style === "pedang" && (s.atkT > 0 || action))) {
    const glow = ctx.createRadialGradient(s.px, s.py - 50, 8, s.px, s.py - 50, 64);
    glow.addColorStop(0, s.rageT > 0 ? "rgba(255,52,43,0.32)" : "rgba(238,25,48,0.22)");
    glow.addColorStop(1, "rgba(255,20,45,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(s.px, s.py - 50, 58, 64, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.invT > 0) {
    ctx.strokeStyle = s.style === "pedang" ? "rgba(255,91,101,0.82)" : "rgba(125,211,252,0.8)";
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(s.px, s.py - h / 2, 30, h / 2 + 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (s.style === "pedang" && v.heroReady) {
    let source = v.heroImg;
    let runNext = null;
    let runBlend = 0;
    let cell = null;
    let spin = 0;
    let lift = 0;
    const atlasReady = v.actionSheetReady && v.actionSheet.naturalWidth > 0;
    if (action && atlasReady) {
      if (action.type === "slash") {
        const col = actionP < 0.24 ? 0 : actionP < 0.64 ? 1 : 2;
        cell = 4 + col;
      } else if (action.type === "spin") {
        cell = actionP < 0.25 ? 4 : actionP < 0.52 ? 5 : actionP < 0.79 ? 6 : 5;
      } else if (action.type === "storm") {
        // Jurus pamungkas bergerak cepat tetapi tetap berpijak, bukan melompat.
        cell = actionP < 0.24 ? 4 : actionP < 0.5 ? 5 : actionP < 0.76 ? 6 : 4;
      } else if (action.type === "jump") {
        cell = 7;
      }
      if (cell != null) source = v.actionSheet;
    }
    if (cell == null && !s.onGround && atlasReady) {
      source = v.actionSheet;
      cell = 7;
    }
    if (cell == null && moving && s.onGround && v.runFrames?.length) {
      const phase = v.runPhase ?? v.time * 8;
      const framePosition = phase % v.runFrames.length;
      const idx = Math.floor(framePosition);
      const localPhase = framePosition - idx;
      const run = v.runFrames[idx];
      if (run?.complete && run.naturalWidth > 0) {
        source = run;
        if (localPhase > 0.72) {
          const next = v.runFrames[(idx + 1) % v.runFrames.length];
          if (next?.complete && next.naturalWidth > 0) {
            runNext = next;
            runBlend = (localPhase - 0.72) / 0.28;
          }
        }
      }
    }
    const artHeight = s.crouch ? 82 : 106;
    const actionHeight = action?.type === "slash" && actionP >= 0.24 && actionP < 0.64 ? 82 : artHeight;
    const bounds = cell != null ? ACTION_BOUNDS[cell] : null;
    const sourceRatio = cell != null
      ? bounds[2] / bounds[3]
      : source.naturalWidth / source.naturalHeight;
    const drawHeight = cell != null ? actionHeight : artHeight;
    const artWidth = drawHeight * sourceRatio;
    const lean = action?.type === "slash" ? -f * Math.sin(actionP * Math.PI) * 0.12 : action?.type === "spin" ? -f * Math.sin(actionP * Math.PI * 2) * 0.07 : moving ? Math.sin(v.time * 8) * 0.01 : 0;
    const pivotSpin = Math.abs(spin) > 0.01;
    ctx.save();
    ctx.translate(s.px, s.py + bob + lift - (pivotSpin ? drawHeight / 2 : 0));
    ctx.scale(f, 1);
    ctx.rotate(lean + spin);
    ctx.shadowColor = "rgba(255,24,46,0.32)";
    ctx.shadowBlur = s.rageT > 0 ? 24 : action ? 15 : 7;
    const actorAlpha = ctx.globalAlpha;
    if (cell != null) {
      const sw = source.naturalWidth / 4;
      const sh = source.naturalHeight / 2;
      const [bx, by, bw, bh] = bounds;
      ctx.drawImage(source, (cell % 4) * sw + bx * sw / 288, Math.floor(cell / 4) * sh + by * sh / 384, bw * sw / 288, bh * sh / 384, -artWidth * 0.5, pivotSpin ? -drawHeight / 2 : -drawHeight, artWidth, drawHeight);
    } else if (runNext) {
      ctx.globalAlpha = actorAlpha * (1 - runBlend);
      ctx.drawImage(source, -artWidth * 0.5, pivotSpin ? -drawHeight / 2 : -drawHeight, artWidth, drawHeight);
      ctx.globalAlpha = actorAlpha * runBlend;
      ctx.drawImage(runNext, -artWidth * 0.5, -drawHeight, artWidth, drawHeight);
      ctx.globalAlpha = actorAlpha;
    } else {
      ctx.drawImage(source, -artWidth * 0.5, pivotSpin ? -drawHeight / 2 : -drawHeight, artWidth, drawHeight);
    }
    ctx.restore();
  } else {
    rr(ctx, s.px - 14, s.py - h + 14 + bob, 28, h - 14, 10);
    ctx.fillStyle = color;
    ctx.fill();
    const hy = s.py - h + 4 + bob;
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.px, hy, 16, 0, Math.PI * 2);
    ctx.clip();
    if (v.imgReady) ctx.drawImage(v.img, s.px - 16, hy - 16, 32, 32);
    else {
      ctx.fillStyle = "#e9d5ff";
      ctx.fillRect(s.px - 16, hy - 16, 32, 32);
    }
    ctx.restore();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.px, hy, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  if ((s.atkT > 0 || (action && (action.type === "slash" || action.type === "storm"))) && s.style === "pedang") {
    const p = action ? actionP : 1 - s.atkT / 0.24;
    const start = -1.1 + p * 1.2;
    ctx.save();
    ctx.translate(s.px + f * 6, s.py - 58 + bob);
    ctx.scale(f, 1);
    ctx.shadowColor = "#ff233f";
    ctx.shadowBlur = 22;
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(255,35,62,${0.85 * (1 - p * 0.35)})`;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(0, 0, 52, start - 0.55, start + 0.68);
    ctx.stroke();
    ctx.shadowBlur = 7;
    ctx.strokeStyle = "rgba(255,249,225,0.96)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 52, start - 0.49, start + 0.63);
    ctx.stroke();
    ctx.restore();
  } else if (s.atkT > 0) {
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

function drawEffects(ctx, effects, time) {
  effects.forEach((p) => {
    const alpha = Math.max(0, Math.min(1, p.life / p.max));
    ctx.save();
    if (p.type === "slash" || p.type === "wave") {
      const progress = 1 - alpha;
      ctx.translate(p.x, p.y);
      ctx.scale(p.face || 1, 1);
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.shadowColor = "#ff1f3e";
      ctx.shadowBlur = p.type === "wave" ? 30 : 22;
      if (p.type === "wave") {
        ctx.strokeStyle = "rgba(255,37,63,0.85)";
        ctx.lineWidth = 20 * alpha + 4;
        ctx.beginPath();
        ctx.ellipse(progress * 120, 0, 28 + progress * 36, 54 + progress * 28, -0.35, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,235,207,0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = p.heavy ? "rgba(255,25,48,0.9)" : "rgba(255,53,73,0.82)";
        ctx.lineWidth = p.heavy ? 17 * alpha + 2 : 10 * alpha + 2;
        ctx.beginPath();
        ctx.ellipse(18 + progress * 24, 2, 54 + progress * 32, 26 + progress * 14, -0.45, -1.2, 1.05);
        ctx.stroke();
        ctx.shadowBlur = 6;
        ctx.strokeStyle = "rgba(255,247,225,0.96)";
        ctx.lineWidth = p.heavy ? 4 : 2.5;
        ctx.beginPath();
        ctx.ellipse(18 + progress * 24, 2, 54 + progress * 32, 26 + progress * 14, -0.45, -1.2, 1.05);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || (Math.sin(time * 30 + p.x) > 0 ? "#fff2ca" : "#ff334b");
      ctx.shadowColor = p.color || "#ff334b";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.35 + alpha * 0.65), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
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
  if ((s.stage - 1) % THEMES.length === 0) {
    const moon = ctx.createRadialGradient(500, 83, 10, 500, 83, 62);
    moon.addColorStop(0, "rgba(255,126,137,0.95)");
    moon.addColorStop(0.42, "rgba(197,38,62,0.72)");
    moon.addColorStop(1, "rgba(197,38,62,0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(500, 83, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(249,185,181,0.78)";
    ctx.beginPath();
    ctx.arc(500, 83, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(90,27,39,0.28)";
    ctx.beginPath();
    ctx.arc(489, 74, 8, 0, Math.PI * 2);
    ctx.arc(510, 90, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(-s.cam * 0.17, 0);
  for (let i = 0; i < 4; i++) {
    const x = 42 + i * 205;
    const base = GROUND - 12;
    ctx.fillStyle = "rgba(8,7,14,0.58)";
    ctx.fillRect(x, base - 92, 11, 92);
    ctx.fillRect(x + 54, base - 92, 11, 92);
    ctx.fillRect(x - 8, base - 96, 81, 10);
    ctx.fillRect(x - 16, base - 106, 97, 11);
    ctx.fillRect(x + 5, base - 80, 45, 5);
  }
  ctx.restore();
  for (let i = 0; i < 18; i++) {
    const x = (((i * 97 - s.cam * 0.12) % (W + 30)) + W + 30) % (W + 30);
    const y = 92 + ((i * 53) % 185) + Math.sin(time * 1.8 + i) * 9;
    const r = 1 + (i % 3) * 0.45;
    ctx.fillStyle = i % 4 === 0 ? "rgba(255,210,164,0.8)" : "rgba(255,64,68,0.72)";
    ctx.shadowColor = "#ff2b3e";
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
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
  const shadowScale = Math.max(0.32, 1 - Math.max(0, GROUND - s.py) / 115);
  ctx.fillStyle = "rgba(4, 3, 8, 0.56)";
  ctx.beginPath();
  ctx.ellipse(s.px, GROUND - 1, 18 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  player(ctx, s, v);
  drawEffects(ctx, v.effects || [], time);

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
    s.style === "pedang"
      ? hpFrac > 0.5 ? "#ef4444" : hpFrac > 0.25 ? "#facc15" : "#fb7185"
      : hpFrac > 0.5 ? "#4ade80" : hpFrac > 0.25 ? "#facc15" : "#f87171",
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
