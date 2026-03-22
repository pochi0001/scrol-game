const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const messageBox = document.getElementById("messageBox");

const GRAVITY = 0.65;
const FRICTION = 0.82;
let WORLD_WIDTH = 5200;
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

let currentStage = 0;

const stages = [
  {
    name: "STAGE 1",
    startX: 100,
    startY: 250,
    goal: { x: 1800, y: 320, w: 20, h: 140 },

    platforms: [
      { x: 0, y: GROUND_Y, w: 900, h: 80 },
      { x: 1020, y: GROUND_Y, w: 520, h: 80 },
      { x: 1670, y: GROUND_Y, w: 300, h: 80 },
    ],

    enemies: [
      { x: 1180, y: 432, w: 34, h: 28, vx: -1.1, alive: true, type: "walker" },
    ],

    orbs: [
      { x: 1110, y: 380, r: 10, taken: false },
      { x: 1280, y: 360, r: 10, taken: false },
      { x: 1750, y: 380, r: 10, taken: false },
    ],
  },

  {
    name: "STAGE 2",
    startX: 100,
    startY: 250,
    goal: { x: 2600, y: 320, w: 20, h: 140 },

    platforms: [
      { x: 0, y: GROUND_Y, w: 700, h: 80 },
      { x: 860, y: GROUND_Y, w: 420, h: 80 },
      { x: 1420, y: 390, w: 140, h: 26, type: "bounce" },
      { x: 1650, y: 340, w: 160, h: 26 },
      { x: 1920, y: GROUND_Y, w: 380, h: 80 },
      { x: 2360, y: GROUND_Y, w: 340, h: 80 },
    ],

    enemies: [
      { x: 940, y: 432, w: 34, h: 28, vx: 1.1, alive: true, type: "walker" },
      { x: 2050, y: 432, w: 34, h: 28, vx: -1.2, alive: true, type: "walker" },
    ],

    orbs: [
      { x: 960, y: 380, r: 10, taken: false },
      { x: 1490, y: 340, r: 10, taken: false },
      { x: 1710, y: 290, r: 10, taken: false },
      { x: 2430, y: 380, r: 10, taken: false },
    ],
  },
  {
    name: "STAGE 3",
    startX: 100,
    startY: 250,
    goal: { x: 3200, y: 320, w: 20, h: 140 },

    platforms: [
      { x: 0, y: GROUND_Y, w: 620, h: 80 },
      { x: 760, y: GROUND_Y, w: 360, h: 80 },
      { x: 1240, y: 390, w: 140, h: 26 },
      { x: 1460, y: 340, w: 140, h: 26, type: "moving", startX: 1460, range: 100, speed: 2.0, dir: 1 },
      { x: 1690, y: GROUND_Y, w: 520, h: 80 },
      { x: 2340, y: GROUND_Y, w: 280, h: 80 },
      { x: 2740, y: 380, w: 140, h: 26 },
      { x: 2960, y: GROUND_Y, w: 320, h: 80 },
    ],

    enemies: [
      { x: 840, y: 432, w: 34, h: 28, vx: 1.2, alive: true, type: "walker" },
      { x: 1810, y: 432, w: 34, h: 28, vx: -1.2, alive: true, type: "walker" },
      { x: 2440, y: 432, w: 34, h: 28, vx: 1.3, alive: true, type: "walker" },
      { x: 2120, y: 432, w: 34, h: 36, vx: 0, vy: 0, alive: true, type: "jumper", jumpPower: 10, jumpCooldown: 0 }
    ],

    orbs: [
      { x: 820, y: 380, r: 10, taken: false },
      { x: 1310, y: 340, r: 10, taken: false },
      { x: 1530, y: 290, r: 10, taken: false },
      { x: 2410, y: 380, r: 10, taken: false },
      { x: 2790, y: 330, r: 10, taken: false },
      { x: 3070, y: 380, r: 10, taken: false },
    ],
  },

  {
    name: "STAGE 4",
    startX: 100,
    startY: 250,
    goal: { x: 3900, y: 320, w: 20, h: 140 },
    rabbit: { x: 420, y: 410, w: 34, h: 34, taken: false },

    platforms: [
      { x: 0, y: GROUND_Y, w: 560, h: 80 },
      { x: 700, y: GROUND_Y, w: 300, h: 80 },
      { x: 1120, y: 400, w: 120, h: 26 },
      { x: 1320, y: 350, w: 120, h: 26, type: "movingY", startY: 350, range: 70, speed: 1.6, dir: 1 },
      { x: 1520, y: 300, w: 120, h: 26 },
      { x: 1760, y: GROUND_Y, w: 480, h: 80 },
      { x: 2400, y: GROUND_Y, w: 260, h: 80 },
      { x: 2800, y: 390, w: 130, h: 26, type: "bounce" },
      { x: 3010, y: 340, w: 130, h: 26 },
      { x: 3240, y: GROUND_Y, w: 700, h: 80 },
    ],

    enemies: [
      { x: 780, y: 432, w: 34, h: 28, vx: 1.2, alive: true, type: "walker" },
      { x: 1860, y: 432, w: 34, h: 28, vx: -1.3, alive: true, type: "walker" },
      { x: 2480, y: 432, w: 34, h: 28, vx: 1.4, alive: true, type: "walker" },
      { x: 3360, y: 432, w: 34, h: 28, vx: -1.4, alive: true, type: "walker" },
      { x: 2600, y: 432, w: 34, h: 28, vx: 1.4, vy: 1, alive: true, type: "jumper", jumpPower: 10, jumpCooldown: 0 }
    ],

    orbs: [
      { x: 790, y: 380, r: 10, taken: false },
      { x: 1180, y: 350, r: 10, taken: false },
      { x: 1380, y: 300, r: 10, taken: false },
      { x: 1580, y: 250, r: 10, taken: false },
      { x: 2460, y: 380, r: 10, taken: false },
      { x: 2870, y: 340, r: 10, taken: false },
      { x: 3080, y: 290, r: 10, taken: false },
      { x: 3640, y: 380, r: 10, taken: false },
    ],
  }
];

function loadStage(stageIndex) {
  const stage = stages[stageIndex];

  platforms = stage.platforms.map(p => ({ ...p }));
  enemies = stage.enemies.map(e => ({ ...e }));
  orbs = stage.orbs.map(o => ({ ...o }));
  goal = { ...stage.goal };
  rabbit = stage.rabbit ? { ...stage.rabbit } : null;

  WORLD_WIDTH = goal.x + 260;

  player.x = stage.startX;
  player.y = stage.startY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.isDying = false;
  player.rotation = 0;
  player.hasRabbit = false;
  player.jumpPower = player.baseJumpPower;

  lastSafeX = stage.startX;
  lastSafeY = stage.startY;

  cameraX = 0;
  invincibleTimer = 0;
  deathAnimationTimer = 0;
  rabbitPop = null;
}

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
  baseJumpPower: 14,
  onGround: false,
  facing: 1,
  isDying: false,
  rotation: 0,
  hasRabbit: false,
};

let platforms = [];
let enemies = [];
let orbs = [];
let goal = { x: 0, y: 0, w: 20, h: 140 };
let rabbit = null;
let rabbitPop = null;



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

function fullReset() {
  currentStage = 0;

  orbsCollected = 0;
  score = 0;
  lives = 3;

  gameOver = false;
  gameClear = false;
  gameStarted = false;

  loadStage(currentStage);

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

        if (p.type === "bounce") {
        player.vy = -22;
        player.onGround = false;
        } else {
        player.vy = 0;
        player.onGround = true;

        if (p.type === "moving") {
            player.x += p.speed * p.dir;
        }

        if (p.type === "movingY") {
            player.y += p.speed * p.dir;
        }
        }

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

function updateMovingPlatforms() {
  for (const p of platforms) {
    if (p.type === "moving") {
      p.x += p.speed * p.dir;

      if (p.x > p.startX + p.range) {
        p.x = p.startX + p.range;
        p.dir = -1;
      }

      if (p.x < p.startX - p.range) {
        p.x = p.startX - p.range;
        p.dir = 1;
      }
    }

    if (p.type === "movingY") {
      p.y += p.speed * p.dir;

      if (p.y > p.startY + p.range) {
        p.y = p.startY + p.range;
        p.dir = -1;
      }

      if (p.y < p.startY - p.range) {
        p.y = p.startY - p.range;
        p.dir = 1;
      }
    }
  }
}

function updateEnemies() {
    if (player.isDying) return;

    for (const enemy of enemies) {
    if (!enemy.alive) continue;

    if (enemy.type === "jumper") {
        enemy.jumpCooldown--;

        if (enemy.jumpCooldown <= 0) {
        enemy.vy = -enemy.jumpPower;
        enemy.jumpCooldown = 90;
        }

        enemy.vy += GRAVITY * 0.75;
        enemy.y += enemy.vy;

        let landed = false;

        for (const p of platforms) {
        const prevBottom = enemy.y - enemy.vy + enemy.h;

        if (rectsOverlap(enemy, p)) {
            if (prevBottom <= p.y + 10 && enemy.vy >= 0) {
            enemy.y = p.y - enemy.h;
            enemy.vy = 0;
            landed = true;
            }
        }
        }

        if (!landed && enemy.y + enemy.h > GROUND_Y) {
        enemy.y = GROUND_Y - enemy.h;
        enemy.vy = 0;
        }
    } else {
        // walker
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
    }

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

function updateRabbit() {
  if (!rabbit || rabbit.taken || player.isDying) return;

  if (rectsOverlap(player, rabbit)) {
    rabbit.taken = true;
    player.hasRabbit = true;
    player.jumpPower = 19;
    score += 200;
  }
}

function updateRabbitPop() {
  if (!rabbitPop) return;

  rabbitPop.x += rabbitPop.vx;
  rabbitPop.y += rabbitPop.vy;
  rabbitPop.vy += rabbitPop.gravity;
  rabbitPop.timer++;

  if (rabbitPop.timer > 45) {
    rabbitPop = null;
  }
}

function updateGoal() {
  if (player.isDying || gameClear) return;

  const flagHitbox = { x: goal.x - 10, y: goal.y, w: 40, h: goal.h };

  if (rectsOverlap(player, flagHitbox)) {
    gameClear = true;
    gameStarted = false;
    playSound("clear", 0.7);

    const isLastStage = currentStage === stages.length - 1;

    if (isLastStage) {
      showMessage(
        "ぜんぶクリア！",
        `4ステージクリア達成！<br>スコア: ${score}<br>オーブ: ${orbsCollected}個<br><br>Rキーまたは画面下のREボタンでもう一度遊べます。`
        );
    } else {
      showMessage(
        `${stages[currentStage].name} クリア！`,
        `スコア: ${score}<br>オーブ: ${orbsCollected}個<br><br>次は ${stages[currentStage + 1].name}！<br>何かキーを押すと進みます。`
        );
    }
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

  if (player.hasRabbit) {
    rabbitPop = {
      x: player.x,
      y: player.y + 10,
      vx: player.facing === 1 ? 3.2 : -3.2,
      vy: -8.5,
      gravity: 0.45,
      timer: 0,
    };

    player.hasRabbit = false;
    player.jumpPower = player.baseJumpPower;
    invincibleTimer = 120;
    player.vy = -10;

    playSound("jump", 0.3);
    return;
  }

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

    // 本体色
    if (p.type === "bounce") {
      ctx.fillStyle = "#ec4899";
    } else if (p.type === "moving" || p.type === "movingY") {
      ctx.fillStyle = "#3b82f6";
    } else {
      ctx.fillStyle = p.h > 40 ? "#8b5a2b" : "#b7791f";
    }
    ctx.fillRect(x, p.y, p.w, p.h);

    // 上面の色
    if (p.type === "bounce") {
      ctx.fillStyle = "#f9a8d4";
    } else if (p.type === "moving" || p.type === "movingY") {
      ctx.fillStyle = "#93c5fd";
    } else {
      ctx.fillStyle = "#6ee7b7";
    }
    ctx.fillRect(x, p.y, p.w, 10);

    // 模様
    for (let i = 0; i < p.w; i += 32) {
      const brickW = Math.min(30, p.w - i);
      if (brickW <= 0) continue;

      ctx.strokeStyle = "rgba(0,0,0,.08)";
      ctx.strokeRect(x + i, p.y + 12, brickW, Math.max(10, p.h - 14));
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

    if (player.hasRabbit) {
        // うさぎ本体（プレイヤーの下）
        ctx.fillStyle = "#f5f5f5";
        ctx.beginPath();
        ctx.roundRect(drawX + 1, drawY + 18, 32, 24, 12);
        ctx.fill();

        // うさぎの足
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(drawX + 4, drawY + 38, 8, 6);
        ctx.fillRect(drawX + 22, drawY + 38, 8, 6);

        // うさぎの耳
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(drawX + 2, drawY - 14, 8, 18);
        ctx.fillRect(drawX + 24, drawY - 14, 8, 18);

        // 耳の内側
        ctx.fillStyle = "#f9a8d4";
        ctx.fillRect(drawX + 4, drawY - 10, 4, 11);
        ctx.fillRect(drawX + 26, drawY - 10, 4, 11);

        // うさぎの顔
        ctx.fillStyle = "#111827";
        ctx.fillRect(drawX + 7, drawY + 26, 3, 3);
        ctx.fillRect(drawX + 23, drawY + 26, 3, 3);

        ctx.fillStyle = "#fca5a5";
        ctx.fillRect(drawX + 14, drawY + 30, 4, 3);
        }

  const riderOffsetY = player.hasRabbit ? -6 : 0;

    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(drawX + 6, drawY + riderOffsetY, 22, 12);

    ctx.fillStyle = "#fde68a";
    ctx.fillRect(drawX + 8, drawY + 10 + riderOffsetY, 18, 12);

    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(drawX + 4, drawY + 22 + riderOffsetY, 26, 18);

  ctx.fillStyle = "#111827";
    const eyeX = player.isDying
    ? 14
    : (player.facing === 1 ? 20 : 10);
    ctx.fillRect(drawX + eyeX, drawY + 14 + riderOffsetY, 4, 4);

  ctx.fillStyle = "#334155";
  ctx.fillRect(drawX + 2, drawY + 40 + riderOffsetY, 10, 4);
  ctx.fillRect(drawX + 22, drawY + 40 + riderOffsetY, 10, 4);

  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const x = enemy.x - cameraX;

    ctx.fillStyle = enemy.type === "jumper" ? "#dc2626" : "#334155";
    ctx.beginPath();
    ctx.roundRect(x, enemy.y, enemy.w, enemy.h, 10);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 7, enemy.y + 8, 4, 4);
    ctx.fillRect(x + 23, enemy.y + 8, 4, 4);

    ctx.fillStyle = enemy.type === "jumper" ? "#fecaca" : "#fef3c7";
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

function drawRabbit() {
  if (!rabbit || rabbit.taken) return;

  const x = rabbit.x - cameraX;
  const y = rabbit.y;

  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  ctx.roundRect(x, y, rabbit.w, rabbit.h, 12);
  ctx.fill();

  // 耳
  ctx.fillRect(x + 6, y - 12, 8, 16);
  ctx.fillRect(x + 20, y - 12, 8, 16);

  // 顔
  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 8, y + 10, 4, 4);
  ctx.fillRect(x + 22, y + 10, 4, 4);

  ctx.fillStyle = "#fca5a5";
  ctx.fillRect(x + 14, y + 18, 6, 4);
}

function drawRabbitPop() {
  if (!rabbitPop) return;

  const x = rabbitPop.x - cameraX;
  const y = rabbitPop.y;

  ctx.save();

  // 少しふわっと感
  const tilt = rabbitPop.vx > 0 ? 0.18 : -0.18;
  ctx.translate(x + 17, y + 17);
  ctx.rotate(tilt);

  // 本体
  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  ctx.roundRect(-16, -10, 32, 20, 10);
  ctx.fill();

  // 耳
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(-12, -24, 8, 16);
  ctx.fillRect(4, -24, 8, 16);

  ctx.fillStyle = "#f9a8d4";
  ctx.fillRect(-10, -20, 4, 10);
  ctx.fillRect(6, -20, 4, 10);

  // 顔
  ctx.fillStyle = "#111827";
  ctx.fillRect(-7, -2, 3, 3);
  ctx.fillRect(4, -2, 3, 3);

  ctx.fillStyle = "#fca5a5";
  ctx.fillRect(-1, 3, 4, 3);

  ctx.restore();
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
  ctx.roundRect(18, 18, 340, 72, 18);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 24px system-ui";
  ctx.fillText(`SCORE ${score}`, 34, 46);
  ctx.fillText(`ORB ${orbsCollected}`, 34, 74);
  ctx.fillText(`LIFE ${lives}`, 172, 74);

ctx.font = "bold 18px system-ui";
ctx.fillText(`${stages[currentStage].name}  (${currentStage + 1}/${stages.length})`, 240, 46);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawOrbs();
  drawRabbit();
  drawRabbitPop();
  drawGoal();
  drawEnemies();
  drawPlayer();
  drawHUD();
}

function loop() {
  if (player.isDying) {
    updateDeathAnimation();
  } else if (gameStarted && !gameOver && !gameClear) {
    updateMovingPlatforms();
    updatePlayer();
    updateEnemies();
    updateOrbs();
    updateRabbit();
    updateGoal();
  }

  updateRabbitPop();

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

  if (gameClear) {
    const isLastStage = currentStage === stages.length - 1;

    if (!isLastStage) {
      currentStage++;
      gameClear = false;
      gameOver = false;
      gameStarted = true;
      hideMessage();
      loadStage(currentStage);
    }
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

  if (isPressed && gameClear) {
    const isLastStage = currentStage === stages.length - 1;

    if (!isLastStage) {
      currentStage++;
      gameClear = false;
      gameOver = false;
      gameStarted = true;
      hideMessage();
      loadStage(currentStage);
    }
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

bindTouchControls();
fullReset();
loop();