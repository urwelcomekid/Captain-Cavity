const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Keep pixel art sharp and prevent blurriness
ctx.imageSmoothingEnabled = false;

// -------------------------------------------------------------
// 1. LOAD IMAGE ASSETS
// -------------------------------------------------------------
const maleSprite = new Image();
maleSprite.src = "assets/hero_male.png";

const femaleSprite = new Image();
femaleSprite.src = "assets/hero_female.png";

const toothImg = new Image();
toothImg.src = "assets/obstacle_tooth.png";

const cavityImg = new Image();
cavityImg.src = "assets/enemy_cavity.png";

// Game States
let gameRunning = false;
let score = 0;
let selectedGender = "male"; 

// Input States
let isSwinging = false; // Floss Action
let isAttacking = false; // Toothbrush Action

// Hero Object
const player = {
  x: 100,
  y: 260,
  width: 60,
  height: 80,
  groundY: 260,
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

// Main Loop
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
      y: type === "tooth" ? 270 : 270,
      width: 50,
      height: 70,
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

    if (obs.x < -50) obstacles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // -------------------------------------------------------------
  // DRAW GROUND (Gums)
  // -------------------------------------------------------------
  ctx.fillStyle = "#881122";
  ctx.fillRect(0, 340, canvas.width, 60);

  // -------------------------------------------------------------
  // DRAW PLAYER SPRITE
  // -------------------------------------------------------------
  const activeSprite = (selectedGender === "male") ? maleSprite : femaleSprite;
  
  // Choose sprite state (Swat, Swing, or Run)
  if (isAttacking) {
    // Attack Pose (Top Right of sheet)
    ctx.drawImage(activeSprite, 680, 20, 110, 140, player.x, player.y, player.width + 20, player.height);
  } else if (isSwinging) {
    // Floss Swing Pose (Top Middle-Right of sheet)
    ctx.drawImage(activeSprite, 550, 20, 110, 140, player.x, player.y, player.width, player.height);
  } else {
    // Running Pose (First sprite frame)
    ctx.drawImage(activeSprite, 10, 20, 110, 140, player.x, player.y, player.width, player.height);
  }

  // Draw Floss Line Visual during Swing
  if (isSwinging) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 30, player.y);
    ctx.lineTo(player.x + 80, 0);
    ctx.stroke();
  }

  // -------------------------------------------------------------
  // DRAW OBSTACLES
  // -------------------------------------------------------------
  obstacles.forEach(obs => {
    if (obs.type === "tooth") {
      // Crop Healthy Tooth from toothImg sheet
      ctx.drawImage(toothImg, 500, 20, 130, 150, obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === "cavity") {
      // Crop Cavity Villain from cavityImg sheet
      ctx.drawImage(cavityImg, 150, 20, 130, 150, obs.x, obs.y, obs.width, obs.height);
    }
  });
}

function gameOver(reason) {
  gameRunning = false;
  alert("GAME OVER: " + reason + "\nFinal Score: " + Math.floor(score / 5));
  charSelectMenu.style.display = "block";
}
