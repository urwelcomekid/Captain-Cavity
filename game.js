function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. DRAW BACKGROUND IMAGE
  if (bgImg.complete && bgImg.naturalWidth !== 0) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    // Fallback if image isn't loaded yet
    ctx.fillStyle = "#330011";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#881122";
    ctx.fillRect(0, 320, canvas.width, 80);
  }

  // 2. DRAW HERO SPRITE (Clean Transparency)
  const activeSprite = (selectedGender === "male") ? maleSprite : femaleSprite;

  if (activeSprite.complete && activeSprite.naturalWidth !== 0) {
    const colWidth = activeSprite.naturalWidth / 7;
    const rowHeight = activeSprite.naturalHeight / 2;
    const targetRow = (selectedGender === "male") ? 0 : 1;
    let targetCol = 0;

    if (isAttacking) {
      targetCol = 6; // Attack pose
    } else if (isSwinging) {
      targetCol = 5; // Swing pose
    } else {
      targetCol = Math.floor(animFrameTimer / 8) % 5; // Running cycle
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
