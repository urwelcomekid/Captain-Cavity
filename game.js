const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Keep pixel art sharp
ctx.imageSmoothingEnabled = false;

// -------------------------------------------------------------
// 1. LOAD ASSETS
// -------------------------------------------------------------
const bgImg = new Image();
bgImg.src = "assets/bg_mouth.png";

const maleSprite = new Image();
maleSprite.src = "assets/hero_male.jpg"; // Updated to .jpg matching uploaded file

const femaleSprite = new Image();
femaleSprite.src = "assets/hero_female.png";

const toothImg = new Image();
toothImg.src = "assets/obstacle_tooth.jpg"; // Updated to .jpg matching uploaded file

const cavityImg = new Image();
cavityImg.src = "assets/enemy_cavity.jpg"; // Updated to .jpg matching uploaded file

const bgMusic = new Audio("assets/bg_music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

// Game States
let gameRunning = false;
let score = 0;
let selectedGender = "male"; 

// Input States
let isSwinging = false; // Floss Action
let isAttacking = false; // Toothbrush Action
let animFrameTimer = 0;  // Frame counter for run cycle

// Hero Object
const player = {
  x: 100,
  y: 235,
  width: 75,
  height: 95,
  groundY: 235,
  velocityY: 0,
  gravity: 0.6,
  swingForce: -12
};

// Obstacles Array
let obstacles = [];
let spawnTimer = 0;

// UI & Button Elements
const charSelectMenu = document.getElementById("char-select");
const scoreDisplay = document.getElementById("score-display");
const btnSwing = document.getElementById("btn-swing");
const btnSwat = document.getElementById("btn-swat");

document.getElementById("btn-male").onclick = () => startGame("male");
document.getElementById("btn-female").onclick = () => startGame("female");

function startGame(gender) {
  selectedGender = gender;
  charSelectMenu.style.display = "none";
  gameRunning = true;
  score = 0;
  obstacles = [];

  // Play background music
  bgMusic.currentTime = 0;
  bgMusic.play().catch(e => console.log("Audio deferred:", e));

  requestAnimationFrame(gameLoop);
}

// Actions
function doSwing() {
  if (!gameRunning) return;
  if (player.y === player.groundY) {
    player.velocityY = player.swingForce;
    isSwinging = true;
  }
}

function doSwat() {
  if (!gameRunning) return;
  if (!isAttacking) {
    isAttacking = true;
    setTimeout(() => { isAttacking = false; }, 250);
  }
}

// Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "KeyA") doSwing();
  if (e.code === "KeyD" || e.code === "Enter") doSwat();
});

btnSwing.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  doSwing();
});

btnSwat.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  doSwat();
});

// Main Game Loop
function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function update() {
  // Score Tally
  score++;
  scoreDisplay.innerText = "Score: " + Math.floor(score / 5);

  animFrameTimer++;

  // Apply Physics
  player.y += player.velocityY;
  if (player.y < player.groundY) {
    player.velocityY += player.gravity;
  } else {
    player.y = player.groundY;
    player.velocityY = 0;
    isSwinging = false;
  }

  // Spawn Obstacles
  spawnTimer++;
  if (spawnTimer > 100) {
    spawnTimer = 0;
    const type = Math.random() > 0.5 ? "tooth" : "cavity";
    obstacles.push({
      x: canvas.width,
      y: 250,
      width: 55,
      height: 65,
      type: type
    });
  }

  // Check Collisions
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= 6;

    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      if (obs.type === "tooth") {
        if (player.y >= player.groundY - 10) {
          gameOver("Collided with Tooth!");
        }
      } else if (obs.type === "cavity") {
        if (isAttacking) {
          obstacles.splice(i, 1);
          score += 50;
          continue;
        } else {
          gameOver("Hit by Cavity Villain!");
        }
      }
    }

    if (obs.x < -60) obstacles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. DRAW BACKGROUND
  if (bgImg.complete && bgImg.naturalWidth !== 0) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#330011";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#881122";
    ctx.fillRect(0, 320, canvas.width, 80);
  }

  // 2. DRAW HERO SPRITE (8 Columns, 2 Rows)
  const activeSprite = (selectedGender === "male") ? maleSprite : femaleSprite;

  if (activeSprite.complete && activeSprite.naturalWidth !== 0) {
    const colWidth = activeSprite.naturalWidth / 8; // 8 sprite columns
    const rowHeight = activeSprite.naturalHeight / 2; // 2 rows
    const targetRow = 0; // Top row standard pose
    let targetCol = 0;

    if (isAttacking) {
      targetCol = 7; // Column 8 (toothbrush swat pose)
    } else if (isSwinging) {
      targetCol = 6; // Column 7 (floss swing pose)
    } else {
      // Cycle through running animation columns 0 to 5
      targetCol = Math.floor(animFrameTimer / 8) % 6;
    }

    ctx.drawImage(
      activeSprite,
      targetCol * colWidth, targetRow * rowHeight, colWidth, rowHeight,
      player.x, player.y, player.width, player.height
    );
  } else {
    ctx.fillStyle = selectedGender === "male" ? "#00d2ff" : "#ff77bc";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Draw Floss Line Visual during Swing
  if (isSwinging) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 40, player.y + 15);
    ctx.lineTo(player.x + 90, 0);
    ctx.stroke();
  }

  // 3. DRAW OBSTACLES (Cropping single icons from obstacle sheets)
  obstacles.forEach(obs => {
    if (obs.type === "tooth") {
      if (toothImg.complete && toothImg.naturalWidth !== 0) {
        // Slice single tooth from upper right portion of sheet
        const sw = toothImg.naturalWidth * 0.22;
        const sh = toothImg.naturalHeight * 0.48;
        const sx = toothImg.naturalWidth * 0.61;
        const sy = 0;
        ctx.drawImage(toothImg, sx, sy, sw, sh, obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    } else if (obs.type === "cavity") {
      if (cavityImg.complete && cavityImg.naturalWidth !== 0) {
        // Slice purple germ icon from top left portion of sheet
        const sw = cavityImg.naturalWidth * 0.18;
        const sh = cavityImg.naturalHeight * 0.45;
        const sx = 0;
        const sy = 0;
        ctx.drawImage(cavityImg, sx, sy, sw, sh, obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.fillStyle = "#441144";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    }
  });
}

function gameOver(reason) {
  gameRunning = false;
  bgMusic.pause();
  alert("GAME OVER: " + reason + "\nFinal Score: " + Math.floor(score / 5));
  charSelectMenu.style.display = "block";
}
