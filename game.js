const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
let gameRunning = false;
let score = 0;
let selectedGender = "male"; 

// Input Listeners
let isSwinging = false; // Floss Action (Jump/Air state)
let isAttacking = false; // Toothbrush Action (Swat state)

// Hero Object
const player = {
  x: 100,
  y: 260,
  width: 50,
  height: 80,
  groundY: 260,
  velocityY: 0,
  gravity: 0.6,
  swingForce: -12
};

// Obstacles Array (Teeth & Cavities)
let obstacles = [];
let spawnTimer = 0;

// UI Elements
const charSelectMenu = document.getElementById("char-select");
const scoreDisplay = document.getElementById("score-display");

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

// -------------------------------------------------------------
// CONTROLS (Two-Button Action!)
// Key 'A' or 'Space' -> Swing (Floss over Tooth Obstacle)
// Key 'D' or 'Enter' -> Swat (Toothbrush Attack Cavity Villain)
// -------------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  // Action 1: SWING (Floss)
  if ((e.code === "Space" || e.code === "KeyA") && player.y === player.groundY) {
    player.velocityY = player.swingForce;
    isSwinging = true;
  }

  // Action 2: SWAT (Toothbrush)
  if (e.code === "KeyD" || e.code === "Enter") {
    isAttacking = true;
    setTimeout(() => { isAttacking = false; }, 250); // Attack duration 250ms
  }
});

// Main Loop
function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function update() {
  // 1. Score Tally (Dino Jump style)
  score++;
  scoreDisplay.innerText = "Score: " + Math.floor(score / 5);

  // 2. Apply Player Gravity & Swing Movement
  player.y += player.velocityY;
  if (player.y < player.groundY) {
    player.velocityY += player.gravity;
  } else {
    player.y = player.groundY;
    player.velocityY = 0;
    isSwinging = false;
  }

  // 3. Spawn Obstacles (Teeth or Cavities)
  spawnTimer++;
  if (spawnTimer > 100) {
    spawnTimer = 0;
    const type = Math.random() > 0.5 ? "tooth" : "cavity";
    obstacles.push({
      x: canvas.width,
      y: type === "tooth" ? 280 : 270,
      width: 40,
      height: type === "tooth" ? 60 : 50,
      type: type
    });
  }

  // 4. Update & Check Collisions
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= 6; // Move obstacles left

    // Collision Check
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      if (obs.type === "tooth") {
        // Must swing OVER teeth! If grounded, game over.
        if (player.y >= player.groundY - 10) {
          gameOver("Collided with Tooth!");
        }
      } else if (obs.type === "cavity") {
        // Must SWAT cavities! If not attacking, game over.
        if (isAttacking) {
          obstacles.splice(i, 1); // Cavity defeated!
          score += 50; // Bonus points
          continue;
        } else {
          gameOver("Hit by Cavity Villain!");
        }
      }
    }

    // Remove offscreen obstacles
    if (obs.x < -50) obstacles.splice(i, 1);
  }
}

function draw() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Ground Line (Gums)
  ctx.fillStyle = "#881122";
  ctx.fillRect(0, 340, canvas.width, 60);

  // Draw Player Placeholder (Will be replaced with your pixel sprites!)
  ctx.fillStyle = selectedGender === "male" ? "#00d2ff" : "#ff77bc";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw Toothbrush Attack Swing Visual
  if (isAttacking) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(player.x + player.width, player.y + 20, 40, 15);
  }

  // Draw Floss Line Visual during Swing
  if (isSwinging) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 25, player.y);
    ctx.lineTo(player.x + 60, 0); // Floss shoots to roof of mouth
    ctx.stroke();
  }

  // Draw Obstacles
  obstacles.forEach(obs => {
    ctx.fillStyle = obs.type === "tooth" ? "#ffffff" : "#441144";
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}

function gameOver(reason) {
  gameRunning = false;
  alert("GAME OVER: " + reason + "\nFinal Score: " + Math.floor(score / 5));
  charSelectMenu.style.display = "block";
}
