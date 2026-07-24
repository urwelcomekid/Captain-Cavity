const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Keep pixel art sharp and prevent blurriness
ctx.imageSmoothingEnabled = false;

// -------------------------------------------------------------
// 1. LOAD IMAGE & AUDIO ASSETS
// -------------------------------------------------------------
const bgImg = new Image();
bgImg.src = "assets/bg_mouth.png";

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
let isSwinging = false; // Floss Action (Jump)
let isAttacking = false; // Toothbrush Action (Swat)

// Hero Object
const player = {
  x: 100,
  y: 240,
  width: 70,
  height: 90,
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

  // Play background music on start
  bgMusic.currentTime = 0;
  bgMusic.play().catch(e => console.log("Audio deferred:", e));

  requestAnimationFrame(gameLoop);
}

// -------------------------------------------------------------
// ACTIONS & INPUT CONTROLS
// -------------------------------------------------------------
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

// Keyboard Inputs
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "KeyA") doSwing();
  if (e.code === "KeyD" || e.code === "Enter") doSwat();
});

// On-Screen Touch Inputs
btnSwing.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  doSwing();
});

btnSwat.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  doSwat();
});

// -------------------------------------------------------------
// MAIN GAME LOOP
// -------------------------------------------------------------
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

  // Apply Gravity & Physics
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
    obs.x -= 6; // Move obstacles left

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
          obstacles.splice(i, 1); // Cavity defeated
          score += 50;
          continue;
        } else {
          gameOver("Hit by Cavity Villain!");
        }
      }
    }

    // Remove offscreen obstacles
    if (obs.x < -60) obstacles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // -------------------------------------------------------------
  // 1. DRAW MOUTH BACKGROUND
  // -------------------------------------------------------------
  if (bgImg.complete && bgImg.naturalWidth !== 0) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    // Fallback gradient if background image is still loading
    ctx.fillStyle = "#330011";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#881122";
    ctx.fillRect(0, 330, canvas.width, 70);
  }

  // -------------------------------------------------------------
  // 2. DRAW HERO SPRITE
  // -------------------------------------------------------------
  const activeSprite = (selectedGender === "male") ? maleSprite : femaleSprite;

  if (activeSprite.complete && activeSprite.naturalWidth !== 0) {
    ctx.drawImage(activeSprite, player.x, player.y, player.width, player.height);
  } else {
    // Fallback box if sprite is still loading
    ctx.fillStyle = selectedGender === "male" ? "#00d2ff" : "#ff77bc";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Visual Effect: White Floss Line during Swing
  if (isSwinging) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 35, player.y + 10);
    ctx.lineTo(player.x + 85, 0);
    ctx.stroke();
  }

  // Visual Effect: Toothbrush Swipe Box during Swat
  if (isAttacking) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(player.x + player.width, player.y + 20, 35, 15);
  }

  // -------------------------------------------------------------
  // 3. DRAW OBSTACLES (Teeth & Cavity Monsters)
  // -------------------------------------------------------------
  obstacles.forEach(obs => {
    const activeObsImg = (obs.type === "tooth") ? toothImg : cavityImg;

    if (activeObsImg.complete && activeObsImg.naturalWidth !== 0) {
      ctx.drawImage(activeObsImg, obs.x, obs.y, obs.width, obs.height);
    } else {
      // Fallback boxes if images are loading
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
