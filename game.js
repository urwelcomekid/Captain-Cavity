const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Keep pixel art crisp and sharp
ctx.imageSmoothingEnabled = false;

// -------------------------------------------------------------
// 1. LOAD ASSETS
// -------------------------------------------------------------
const bgImg = new Image();
bgImg.src = "assets/bg_mouth.png"; // Optional background (falls back automatically if missing)

const maleSprite = new Image();
maleSprite.src = "assets/hero_male.png";

const femaleSprite = new Image();
femaleSprite.src = "assets/hero_female.png";

const toothImg = new Image();
toothImg.src = "assets/obstacle_tooth.png";

const cavityImg = new Image();
cavityImg.src = "assets/enemy_cavity.png";

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
let animFrameTimer = 0;  // Controls running animation cycle

// Hero Object
const player = {
  x: 100,
  y: 240,
  width: 75,
  height: 95,
  groundY: 240,
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

  // Cycle running animation frames
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
      width: 60,
      height: 75,
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
    ctx.fillRect(0, 330, canvas.width, 70);
  }

  // 2. DRAW HERO SPRITE FROM THE UPLOADED SHEET
  const activeSprite = (selectedGender === "male") ? maleSprite : femaleSprite;

  if (activeSprite.complete && activeSprite.naturalWidth !== 0) {
    // The sprite sheet has 7 columns and 2 rows
    const colWidth = activeSprite.naturalWidth / 7;
    const rowHeight = activeSprite.naturalHeight / 2;

    // Row 0 = Male, Row 1 = Female
    const targetRow = (selectedGender === "male") ? 0 : 1;
    let targetCol = 0;

    if (isAttacking) {
      targetCol = 6; // Attack frame (Col 7)
    } else if (isSwinging) {
      targetCol = 5; // Swing frame (Col 6)
    } else {
      // Cycle through running frames 0 through 4 based on time
      targetCol = Math.floor(animFrameTimer / 8) % 5;
    }

    ctx.drawImage(
      activeSprite,
      targetCol * colWidth, targetRow * rowHeight, colWidth, rowHeight, // Source crop rectangle
      player.x, player.y, player.width, player.height                   // Destination canvas rectangle
    );
  } else {
    // Fallback block if image is still loading
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

  // 3. DRAW OBSTACLES
  obstacles.forEach(obs => {
    const activeObsImg = (obs.type === "tooth") ? toothImg : cavityImg;
    if (activeObsImg.complete && activeObsImg.naturalWidth !== 0) {
      ctx.drawImage(activeObsImg, obs.x, obs.y, obs.width, obs.height);
    } else {
      ctx.fillStyle = (obs.type === "tooth") ? "#ffffff" : "#441144";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  });
}

function gameOver(reason) {
  gameRunning = false;
  bgMusic.pause();
  alert("GAME OVER: " + reason + "\nFinal Score: " + Math.floor(score / 5));
  charSelectMenu.style.display = "block";
}
