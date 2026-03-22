const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const messageBox = document.getElementById("messageBox");

const GRAVITY = 0.65;
const FRICTION = 0.82;
const WORLD_WIDTH = 5200;
const GROUND_Y = 460;

let keys = {};
let touchButtonsBound = false;
let gameStarted = false;
let gameOver = false;
let gameClear = false;
let cameraX = 0;
let orbsCollected = 0;
let lives = 3;
let score = 0;
let invincibleTimer = 0;
let deathAnimationTimer = 0;

let lastSafeX = 100;
let lastSafeY = 250;

const player = {
  x: 100,
  y: 0,
  w: 34,
  h: 44,
  vx: 0,
  vy: 0,
  speed: 0.9,
  maxSpeed: 7,
  jumpPower: 14,
  onGround: false,
  facing: 1,
  isDying: false,
  rotation: 0,
};

const platforms = [
  { x: 0, y: GROUND_Y, w: 900, h: 80 },
  { x: 1020, y: GROUND_Y, w: 520, h: 80 },
  { x: 1670, y: GROUND_Y, w: 650, h: 80 },
  { x: 2380, y: GROUND_Y, w: 340, h: 80 },
  { x: 2810, y: 390, w: 140, h: 26 },
  { x: 3020, y: 340, w: 160, h: 26 },
  { x: 3270, y: GROUND_Y, w: 680, h: 80 },
  { x: 4080, y: GROUND_Y, w: 620, h: 80 },
  { x: 4780, y: GROUND_Y, w: 420, h: 80 },
  { x: 4380, y: 360, w: 130, h: 26 },
  { x: 4550, y: 300, w: 130, h: 26 },
];

let enemies = [];
let orbs = [];
const goal = { x: 5040, y: 320, w: 20, h: 140 };



// ===== 音 =====

// BGM
const bgm = new Audio("./audio/ステージBGM/ABSOLUTE_FUNNY_FIELD.mp3");
bgm.loop = true;
bgm.volume = 0.35;

// 効果音
const sounds = {
  jump: "./audio/効果音/ジャンプ.mp3",
  coin: "./audio/効果音/コイン.mp3",
  stomp: "./audio/効果音/踏む.mp3",
  dead: "./audio/効果音/死.mp3",
  clear: "./audio/効果音/ゴール.mp3",
};

let bgmStarted = false;

function resetEntities() {
  enemies = [
    { x: 1180, y: 420, w: 34, h: 28, vx: -1.1, alive: true },
    { x: 1860, y: 420, w: 34, h: 28, vx: 1.1, alive: true },
    { x: 3450, y: 420, w: 34, h: 28, vx: -1.3, alive: true },
    { x: 4210, y: 420, w: 34, h: 28, vx: 1.4, alive: true },
  ];

  orbs = [
    { x: 1110, y: 380, r: 10, taken: false },
    { x: 1280, y: 360, r: 10, taken: false },
    { x: 1750, y: 380, r: 10, taken: false },
    { x: 2110, y: 380, r: 10, taken: false },
    { x: 2860, y: 340, r: 10, taken: false },
    { x: 3090, y: 290, r: 10, taken: false },
    { x: 4400, y: 310, r: 10, taken: false },
    { x: 4590, y: 250, r: 10, taken: false },
    { x: 4860, y: 380, r: 10, taken: false },
  ];
}

function fullReset() {
  player.x = 100;
  player.y = 250;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.isDying = false;
  player.rotation = 0;
  
  lastSafeX = 100;
  lastSafeY = 250;

  cameraX = 0;
  orbsCollected = 0;
  score = 0;
  lives = 3;
  invincibleTimer = 0;
  deathAnimationTimer = 0;

  gameOver = false;
  gameClear = false;
  gameStarted = false;

  resetEntities();

  showMessage(
    "スタート！",
    "右へ進んで、穴を飛び越え、敵を踏んで、オーブを集めてゴールへ。<br>キーボードか画面下のボタンで始められます。"
  );
}

function respawn() {
  player.x = lastSafeX;
  player.y = lastSafeY - 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.isDying = false;
  player.rotation = 0;
  invincibleTimer = 120;
}

function showMessage(title, body) {
  messageBox.innerHTML = `<h2>${title}</h2><p>${body}</p>`;
  overlay.style.display = "flex";
}

function hideMessage() {
  overlay.style.display = "none";
}

function startBgm() {
  if (bgmStarted) return;
  bgmStarted = true;

  bgm.play().catch(() => {
    bgmStarted = false;
  });
}

function playSound(name, volume = 0.7) {
  const src = sounds[name];
  if (!src) return;

  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function isSafeGroundBelow(px, py) {
  const footX = px + player.w / 2;
  const footY = py + player.h + 2;

  for (const p of platforms) {
    const withinX = footX >= p.x + 20 && footX <= p.x + p.w - 20;
    const nearTop = Math.abs(footY - p.y) < 8;
    const wideEnough = p.w >= 120;

    if (withinX && nearTop && wideEnough) {
      return true;
    }
  }

  return false;
}

function circleRectOverlap(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function updatePlayer() {
   if (player.isDying) return;

  const left = keys["ArrowLeft"] || keys["KeyA"];
  const right = keys["ArrowRight"] || keys["KeyD"];
  const jump = keys["ArrowUp"] || keys["KeyW"] || keys["Space"];

  if (left) {
    player.vx -= player.speed;
    player.facing = -1;
  }

  if (right) {
    player.vx += player.speed;
    player.facing = 1;
  }

  player.vx *= FRICTION;
  if (player.vx > player.maxSpeed) player.vx = player.maxSpeed;
  if (player.vx < -player.maxSpeed) player.vx = -player.maxSpeed;

    if (jump && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    playSound("jump", 0.4);
    }

  player.vy += GRAVITY;

  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD_WIDTH) {
    player.x = WORLD_WIDTH - player.w;
  }

  player.y += player.vy;
  player.onGround = false;

  for (const p of platforms) {
    const prevBottom = player.y - player.vy + player.h;

    if (rectsOverlap(player, p)) {
      if (prevBottom <= p.y + 10 && player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.y >= p.y + p.h - 10 && player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      } else if (player.x + player.w / 2 < p.x + p.w / 2) {
        player.x = p.x - player.w;
        player.vx = 0;
      } else {
        player.x = p.x + p.w;
        player.vx = 0;
      }
    }
  }

    if (player.y > GROUND_Y + 40 && !player.isDying) {
    loseLife();
    return;
    }

    if (player.onGround && !player.isDying && isSafeGroundBelow(player.x, player.y)) {
    lastSafeX = player.x;
    lastSafeY = player.y;
    }

  cameraX = player.x - canvas.width * 0.35;
  cameraX = Math.max(0, Math.min(cameraX, WORLD_WIDTH - canvas.width));

  if (invincibleTimer > 0) invincibleTimer--;
}

function updateEnemies() {
    if (player.isDying) return;

    for (const enemy of enemies) {
    if (!enemy.alive) continue;

    enemy.x += enemy.vx;

    let supported = false;

    for (const p of platforms) {
      const enemyFeetX = enemy.x + enemy.w / 2;
      const enemyBottom = enemy.y + enemy.h;

      if (
        enemyFeetX >= p.x &&
        enemyFeetX <= p.x + p.w &&
        Math.abs(enemyBottom - p.y) < 6
      ) {
        supported = true;
      }

      if (rectsOverlap(enemy, p)) {
        if (enemy.vx > 0) enemy.x = p.x - enemy.w;
        else enemy.x = p.x + p.w;
        enemy.vx *= -1;
      }
    }

    if (!supported) enemy.vx *= -1;

    if (rectsOverlap(player, enemy)) {
      const stomp = player.vy > 0 && player.y + player.h - enemy.y < 20;

      if (stomp) {
            enemy.alive = false;
            player.vy = -9;
            score += 100;
            playSound("stomp", 0.6);
            } else if (invincibleTimer === 0) {
        loseLife();
      }
    }
  }
}

function updateOrbs() {
    if (player.isDying) return;

  for (const orb of orbs) {
    if (orb.taken) continue;

    if (circleRectOverlap(orb, player)) {
      orb.taken = true;
      orbsCollected++;
      score += 50;
      playSound("coin", 0.5);
    }
  }
}

function updateGoal() {
    if (player.isDying) return;

  const flagHitbox = { x: goal.x - 10, y: goal.y, w: 40, h: goal.h };

  if (rectsOverlap(player, flagHitbox)) {
    gameClear = true;
    gameStarted = false;

    playSound("clear", 0.7);

    showMessage(
      "クリア！",
      `スコア: ${score}<br>オーブ: ${orbsCollected}個<br><br>Rキーまたは画面下のREボタンでもう一度遊べます。`
    );
  }
}

function startDeathAnimation() {
  player.isDying = true;
  player.vx = 0;
  player.vy = -12;   // 上に飛ぶ強さ
  player.rotation = Math.PI; // 180度で逆さ
  player.onGround = false;
  deathAnimationTimer = 0;
}

function updateDeathAnimation() {
  deathAnimationTimer++;

  player.y += player.vy;
  player.vy += GRAVITY * 0.9;

  if (player.y > canvas.height + 120) {
    player.isDying = false;
    player.rotation = 0;

    if (lives <= 0) {
      gameOver = true;
      gameStarted = false;

      showMessage(
        "ゲームオーバー",
        `スコア: ${score}<br>オーブ: ${orbsCollected}個<br><br>Rキーまたは画面下のREボタンでやり直し。`
      );
    } else {
      respawn();
    }
  }
}

function loseLife() {
  if (gameOver || gameClear || player.isDying) return;

  lives--;
  playSound("dead", 0.7);
  startDeathAnimation();
}

function drawBackground() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, "#7dd3fc");
  skyGrad.addColorStop(0.68, "#d9f99d");
  skyGrad.addColorStop(0.68, "#86efac");
  skyGrad.addColorStop(1, "#4ade80");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hillOffset1 = -(cameraX * 0.2) % 1200;
  const hillOffset2 = -(cameraX * 0.4) % 800;

  ctx.fillStyle = "#7ccf6b";
  for (let i = -1; i < 4; i++) {
    const x = hillOffset1 + i * 420;
    ctx.beginPath();
    ctx.arc(x + 140, 430, 180, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#4fa95c";
  for (let i = -1; i < 5; i++) {
    const x = hillOffset2 + i * 280;
    ctx.beginPath();
    ctx.arc(x + 100, 470, 120, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 220) - cameraX * 0.15) % (canvas.width + 220);
    drawCloud(
      ((cx + canvas.width + 220) % (canvas.width + 220)) - 110,
      70 + (i % 3) * 40
    );
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 14, 20, 0, Math.PI * 2);
  ctx.arc(x + 52, y, 24, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 6, 24, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  for (const p of platforms) {
    const x = p.x - cameraX;

    ctx.fillStyle = p.h > 40 ? "#8b5a2b" : "#b7791f";
    ctx.fillRect(x, p.y, p.w, p.h);

    ctx.fillStyle = "#6ee7b7";
    ctx.fillRect(x, p.y, p.w, 10);

    for (let i = 0; i < p.w; i += 32) {
      ctx.strokeStyle = "rgba(0,0,0,.08)";
      ctx.strokeRect(x + i, p.y + 12, 30, Math.max(10, p.h - 14));
    }
  }
}

function drawPlayer() {
  const x = player.x - cameraX;

  if (!player.isDying && invincibleTimer > 0 && Math.floor(invincibleTimer / 6) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(x + player.w / 2, player.y + player.h / 2);

  if (player.isDying) {
    ctx.rotate(player.rotation);
  }

  const drawX = -player.w / 2;
  const drawY = -player.h / 2;

  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(drawX + 6, drawY, 22, 12);

  ctx.fillStyle = "#fde68a";
  ctx.fillRect(drawX + 8, drawY + 10, 18, 12);

  ctx.fillStyle = "#06b6d4";
  ctx.fillRect(drawX + 4, drawY + 22, 26, 18);

  ctx.fillStyle = "#111827";
  const eyeX = player.isDying
    ? 14
    : (player.facing === 1 ? 20 : 10);
  ctx.fillRect(drawX + eyeX, drawY + 14, 4, 4);

  ctx.fillStyle = "#334155";
  ctx.fillRect(drawX + 2, drawY + 40, 10, 4);
  ctx.fillRect(drawX + 22, drawY + 40, 10, 4);

  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const x = enemy.x - cameraX;

    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(x, enemy.y, enemy.w, enemy.h, 10);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 7, enemy.y + 8, 4, 4);
    ctx.fillRect(x + 23, enemy.y + 8, 4, 4);

    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(x + 6, enemy.y + 22, 22, 3);
  }
}

function drawOrbs() {
  for (const orb of orbs) {
    if (orb.taken) continue;

    const x = orb.x - cameraX;

    ctx.fillStyle = "#a3e635";
    ctx.beginPath();
    ctx.ellipse(x, orb.y, orb.r * 0.8, orb.r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#65a30d";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.beginPath();
    ctx.moveTo(x, orb.y - 7);
    ctx.lineTo(x, orb.y + 7);
    ctx.stroke();
  }
}

function drawGoal() {
  const poleX = goal.x - cameraX;

  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(poleX, goal.y, goal.w, goal.h);

  ctx.fillStyle = "#8b5cf6";
  ctx.beginPath();
  ctx.moveTo(poleX + goal.w, goal.y + 12);
  ctx.lineTo(poleX + goal.w + 60, goal.y + 28);
  ctx.lineTo(poleX + goal.w, goal.y + 44);
  ctx.closePath();
  ctx.fill();
}

function drawHUD() {
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.roundRect(18, 18, 270, 72, 18);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 24px system-ui";
  ctx.fillText(`SCORE ${score}`, 34, 46);
  ctx.fillText(`ORB ${orbsCollected}`, 34, 74);
  ctx.fillText(`LIFE ${lives}`, 172, 74);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawOrbs();
  drawGoal();
  drawEnemies();
  drawPlayer();
  drawHUD();
}

function loop() {
  if (player.isDying) {
    updateDeathAnimation();
  } else if (gameStarted && !gameOver && !gameClear) {
    updatePlayer();
    updateEnemies();
    updateOrbs();
    updateGoal();
  }

  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  startBgm();

  if (e.code === "KeyR") {
    fullReset();
    return;
  }

  if (!gameStarted && !gameOver && !gameClear) {
    gameStarted = true;
    hideMessage();
  }

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function setVirtualKey(code, isPressed) {
  if (isPressed) {
    startBgm();
  }

  if (code === "KeyR" && isPressed) {
    fullReset();
    return;
  }

  keys[code] = isPressed;

  if (isPressed && !gameStarted && !gameOver && !gameClear) {
    gameStarted = true;
    hideMessage();
  }
}

function bindTouchControls() {
  if (touchButtonsBound) return;
  touchButtonsBound = true;

  const buttons = document.querySelectorAll("[data-key]");

  for (const btn of buttons) {
    const code = btn.dataset.key;

    const press = (e) => {
      e.preventDefault();
      setVirtualKey(code, true);
    };

    const release = (e) => {
      e.preventDefault();
      setVirtualKey(code, false);
    };

    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);

    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
  }
}

resetEntities();
bindTouchControls();
fullReset();
loop();