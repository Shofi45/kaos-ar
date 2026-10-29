import {
  GROUND,
  H,
  MAX_HEARTS,
  PX,
  POWER_INFO,
  SIZE,
  W,
  total,
} from "./engine";

const roundedRect = (ctx, x, y, w, h, r) => {
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

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.7, -s * 1.3, 0, -s * 0.4);
  ctx.bezierCurveTo(s * 0.7, -s * 1.3, s * 1.6, -s * 0.2, 0, s * 0.9);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = "#fb7185";
    ctx.fill();
  } else {
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function coin(ctx, x, y, time) {
  const cx = x + 12;
  const cy = y + 12;
  const sx = Math.abs(Math.cos(time * 4 + x * 0.05)) * 0.7 + 0.3;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, 1);
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(-2, -6, 4, 12);
  ctx.restore();
}

function chest(ctx, t) {
  roundedRect(ctx, t.x, t.y + 8, t.w, t.h - 8, 6);
  ctx.fillStyle = "#92400e";
  ctx.fill();
  roundedRect(ctx, t.x, t.y, t.w, 16, 8);
  ctx.fillStyle = "#b45309";
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(t.x, t.y + 12, t.w, 5);
  ctx.fillRect(t.x + t.w / 2 - 4, t.y + 10, 8, 12);
}

function quizBlock(ctx, t, time) {
  const bob = Math.sin(time * 4) * 3;
  ctx.save();
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 16;
  roundedRect(ctx, t.x, t.y + bob, t.w, t.h, 10);
  ctx.fillStyle = "#7c3aed";
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e9d5ff";
  roundedRect(ctx, t.x, t.y + bob, t.w, t.h, 10);
  ctx.stroke();
  text(ctx, "?", t.x + t.w / 2, t.y + bob + 32, 28);
}

function rock(ctx, t) {
  roundedRect(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fillStyle = "#7c6f9b";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundedRect(ctx, t.x + 4, t.y + 4, t.w * 0.4, t.h * 0.3, 6);
  ctx.fill();
}

function spike(ctx, t) {
  const n = 3;
  const w = t.w / n;
  ctx.fillStyle = "#f472b6";
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(t.x + i * w, t.y + t.h);
    ctx.lineTo(t.x + i * w + w / 2, t.y);
    ctx.lineTo(t.x + (i + 1) * w, t.y + t.h);
    ctx.closePath();
    ctx.fill();
  }
}

function bird(ctx, t, time) {
  const flap = Math.sin(time * 14) * 10;
  const cx = t.x + t.w / 2;
  const cy = t.y + t.h / 2;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy);
  ctx.lineTo(cx + 4, cy - 6 - flap);
  ctx.lineTo(cx + 10, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 1);
  ctx.lineTo(cx - 26, cy + 2);
  ctx.lineTo(cx - 18, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b0716";
  ctx.beginPath();
  ctx.arc(cx - 9, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();
}

function player(ctx, s, v) {
  const cx = PX + SIZE / 2;
  const cy = s.y + SIZE / 2;
  const blink = s.hurtT > 0 && Math.floor(v.time * 14) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = blink ? 0.35 : 1;
  ctx.translate(cx, cy);
  ctx.rotate(Math.max(-0.4, Math.min(0.4, s.vy * 0.0006)));

  if (s.dashT > 0) {
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = (blink ? 0.35 : 1) * (0.25 - i * 0.05);
      ctx.beginPath();
      ctx.arc(-i * 18, 0, SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a";
      ctx.fill();
    }
    ctx.globalAlpha = blink ? 0.35 : 1;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, SIZE / 2, 0, Math.PI * 2);
  ctx.clip();
  if (v.imgReady) {
    ctx.drawImage(v.img, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
  } else {
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE);
  }
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = s.dashT > 0 ? "#fde68a" : "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();

  if (s.power === "shield" && s.shieldReady) {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, SIZE / 2 + 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function powerMeter(ctx, s) {
  if (s.power !== "dash" && s.power !== "shield") return;
  const cx = W - 46;
  const cy = H - 70;
  const r = 28;
  let ready;
  let frac;
  if (s.power === "dash") {
    ready = s.dashCd <= 0;
    frac = ready ? 1 : 1 - s.dashCd / 7;
  } else {
    ready = s.shieldReady;
    frac = ready ? 1 : 1 - Math.max(0, s.shieldCd) / 12;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ready ? "rgba(124, 58, 237, 0.9)" : "rgba(20, 13, 34, 0.85)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#c4b5fd";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
  text(ctx, s.power === "dash" ? "TEBAS" : "PERISAI", cx, cy + 4, 10);
}

export function draw(ctx, s, v) {
  const { canvasW, canvasH, scale, offX, offY, time, best, name } = v;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0b0716";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const shake = v.shake > 0 ? (Math.random() - 0.5) * 8 * v.shake : 0;
  ctx.setTransform(scale, 0, 0, scale, offX + shake, offY);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a0f33");
  sky.addColorStop(1, "#3a1d6e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // bintang dan bukit yang bergerak pelan
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 18; i++) {
    const x = (((i * 97 - s.dist * 0.05) % (W + 20)) + W + 20) % (W + 20);
    const y = 30 + ((i * 53) % 260);
    const tw = 1 + ((Math.sin(time * 2 + i) + 1) / 2) * 1.4;
    ctx.fillRect(x, y, tw, tw);
  }
  ctx.fillStyle = "#2a1650";
  for (let i = 0; i < 4; i++) {
    const x =
      ((((i * 170 - s.dist * 0.2) % (W + 260)) + W + 260) % (W + 260)) - 130;
    ctx.beginPath();
    ctx.ellipse(x, GROUND, 120, 70, 0, Math.PI, 0);
    ctx.fill();
  }

  ctx.fillStyle = "#24133f";
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "#a855f7";
  ctx.fillRect(0, GROUND, W, 4);
  ctx.fillStyle = "rgba(168,85,247,0.35)";
  for (let i = 0; i < 8; i++) {
    const x = ((((i * 60 - s.dist) % (W + 60)) + W + 60) % (W + 60)) - 30;
    ctx.fillRect(x, GROUND + 22, 28, 3);
  }

  s.things.forEach((t) => {
    if (t.type === "coin") coin(ctx, t.x, t.y, time);
    else if (t.type === "chest") chest(ctx, t);
    else if (t.type === "quiz") quizBlock(ctx, t, time);
    else if (t.type === "rock") rock(ctx, t);
    else if (t.type === "spike") spike(ctx, t);
    else if (t.type === "bird") bird(ctx, t, time);
  });

  player(ctx, s, v);

  v.floaters.forEach((f) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.t * 1.6));
    text(ctx, f.text, f.x, f.y - (0.9 - f.t) * 40, 16, f.color || "#fde68a");
    ctx.globalAlpha = 1;
  });

  // papan skor
  for (let i = 0; i < MAX_HEARTS; i++)
    heart(ctx, 24 + i * 26, 28, 20, i < s.hearts);
  ctx.beginPath();
  ctx.arc(20, 62, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  text(ctx, String(s.coins), 34, 68, 18, "#fff", "left");
  text(ctx, `Skor ${total(s)}`, 16, 96, 16, "#e9d5ff", "left");
  text(ctx, `Terbaik ${best}`, 16, 116, 12, "#c4b5fd", "left");
  if (s.clues.length) {
    text(
      ctx,
      `Harta ${s.cluesFound}/${s.clues.length}`,
      16,
      136,
      12,
      "#fcd34d",
      "left",
    );
  }
  powerMeter(ctx, s);

  if (s.toast) text(ctx, s.toast.text, W / 2, 190, 17, "#fff");

  if (s.phase === "ready") {
    ctx.fillStyle = "rgba(11,7,22,0.55)";
    ctx.fillRect(0, 150, W, 250);
    text(ctx, name, W / 2, 205, 26);
    const info = POWER_INFO[s.power];
    text(ctx, `Kuasa: ${info.label}`, W / 2, 238, 16, "#fcd34d");
    text(ctx, info.how, W / 2, 262, 12, "#c4b5fd");
    text(ctx, "Kumpulkan koin, hindari rintangan,", W / 2, 296, 12, "#e9d5ff");
    text(ctx, "jawab soal ?, dan cari harta karun.", W / 2, 314, 12, "#e9d5ff");
    text(ctx, "Ketuk layar untuk mulai", W / 2, 356, 18);
  }
  if (s.phase === "over") {
    ctx.fillStyle = "rgba(11,7,22,0.7)";
    ctx.fillRect(0, 150, W, 270);
    text(ctx, "Game over", W / 2, 200, 32);
    text(ctx, `Skor ${total(s)}`, W / 2, 238, 22, "#e9d5ff");
    text(
      ctx,
      `Koin ${s.coins}   Soal benar ${s.right}`,
      W / 2,
      266,
      14,
      "#c4b5fd",
    );
    if (s.clues.length) {
      text(
        ctx,
        `Harta karun ${s.cluesFound}/${s.clues.length}`,
        W / 2,
        288,
        14,
        "#fcd34d",
      );
    }
    text(ctx, "Ketuk untuk main lagi", W / 2, 340, 17);
  }
}
