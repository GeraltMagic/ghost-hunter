// ============================================================
// Ghost Hunter — Canvas Renderer
// ============================================================

const Renderer = {
  draw(game) {
    const ctx = game.ctx;
    const W = game.canvas.width;
    const H = game.canvas.height;

    ctx.clearRect(0, 0, W, H);

    switch (game.state) {
      case 'menu': this.drawMenu(ctx, W, H, game); break;
      case 'location_select': this.drawLocationSelect(ctx, W, H, game); break;
      case 'investigating': this.drawInvestigation(ctx, W, H, game); break;
      case 'training': this.drawInvestigation(ctx, W, H, game); this.drawTrainingOverlay(ctx, W, H, game); break;
      case 'results': this.drawResults(ctx, W, H, game); break;
      case 'skills': this.drawSkills(ctx, W, H, game); break;
      case 'shop': this.drawShop(ctx, W, H, game); break;
      case 'bestiary': this.drawBestiary(ctx, W, H, game); break;
    }
  },

  // --- Main Menu ---
  drawMenu(ctx, W, H, game) {
    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    // Floating particles
    const t = Date.now() / 1000;
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(t * 0.3 + i * 2.1) * 0.5 + 0.5) * W;
      const py = (Math.cos(t * 0.2 + i * 1.7) * 0.5 + 0.5) * H;
      const alpha = Math.sin(t + i) * 0.15 + 0.15;
      ctx.fillStyle = `rgba(50, 200, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#32c864';
    ctx.shadowColor = 'rgba(50, 200, 100, 0.5)';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 52px "Courier New", monospace';
    ctx.fillText('GHOST HUNTER', W / 2, 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#888';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Paranormal Investigation Unit', W / 2, 215);

    // Player info
    if (game.save) {
      ctx.fillStyle = '#666';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText(`Level ${game.save.level} | XP: ${game.save.xp}/${LEVEL_XP[game.save.level] || '???'} | $${game.save.currency}`, W / 2, 260);
    }

    // Menu buttons (rendered as canvas rects for click handling)
    this._menuButtons = [];
    const buttons = [
      { label: 'TRAINING', action: 'training', accent: !game.save.trainingComplete },
      { label: 'NEW HUNT', action: 'location_select' },
      { label: 'SKILLS', action: 'skills' },
      { label: 'EQUIPMENT', action: 'shop' },
      { label: 'BESTIARY', action: 'bestiary' },
      { label: 'DELETE SAVE', action: 'delete_save', danger: true },
    ];

    const btnW = 260, btnH = 44;
    const startY = 300;
    buttons.forEach((btn, i) => {
      const bx = W / 2 - btnW / 2;
      const by = startY + i * 56;

      const hover = game.mouseX >= bx && game.mouseX <= bx + btnW &&
                    game.mouseY >= by && game.mouseY <= by + btnH;

      const btnColor = btn.danger ? '#c83232' : (btn.accent ? '#c8a032' : '#32c864');
      const btnColorRgb = btn.danger ? '200,50,50' : (btn.accent ? '200,160,50' : '50,200,100');
      ctx.strokeStyle = btnColor;
      ctx.lineWidth = btn.accent ? 2 : 1;
      if (btn.accent && !hover) {
        // Subtle pulse for recommended action
        const pulse = Math.sin(Date.now() / 600) * 0.08 + 0.08;
        ctx.fillStyle = `rgba(${btnColorRgb}, ${pulse})`;
        ctx.fillRect(bx, by, btnW, btnH);
      }
      if (hover) {
        ctx.fillStyle = `rgba(${btnColorRgb}, 0.15)`;
        ctx.fillRect(bx, by, btnW, btnH);
        ctx.shadowColor = `rgba(${btnColorRgb}, 0.3)`;
        ctx.shadowBlur = 15;
      }
      ctx.strokeRect(bx, by, btnW, btnH);
      ctx.shadowBlur = 0;

      ctx.fillStyle = btnColor;
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, W / 2, by + 28);

      this._menuButtons.push({ x: bx, y: by, w: btnW, h: btnH, action: btn.action });
    });
  },

  // --- Location Select ---
  drawLocationSelect(ctx, W, H, game) {
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('SELECT LOCATION', W / 2, 50);

    this._locationButtons = [];
    const locs = Object.values(LOCATIONS);
    const cardW = 260, cardH = 200;
    const gap = 30;
    const totalW = locs.length * cardW + (locs.length - 1) * gap;
    const startX = (W - totalW) / 2;

    locs.forEach((loc, i) => {
      const cx = startX + i * (cardW + gap);
      const cy = 100;
      const locked = game.save.level < loc.requiredLevel;

      const hover = !locked && game.mouseX >= cx && game.mouseX <= cx + cardW &&
                    game.mouseY >= cy && game.mouseY <= cy + cardH;

      ctx.fillStyle = locked ? 'rgba(10,10,20,0.4)' : 'rgba(10,10,20,0.8)';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = hover ? '#32c864' : (locked ? '#222' : '#444');
      ctx.lineWidth = 1;
      if (hover) {
        ctx.shadowColor = 'rgba(50,200,100,0.2)';
        ctx.shadowBlur = 15;
      }
      ctx.strokeRect(cx, cy, cardW, cardH);
      ctx.shadowBlur = 0;

      // Tier indicator
      const tierColors = { 1: '#44aa44', 2: '#ccaa33', 3: '#cc3333' };
      ctx.fillStyle = locked ? '#333' : (tierColors[loc.tier] || '#888');
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TIER ${loc.tier} — ${locked ? 'LOCKED' : 'AVAILABLE'}`, cx + 15, cy + 25);

      // Name
      ctx.fillStyle = locked ? '#444' : '#e0e0e0';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText(loc.name, cx + 15, cy + 55);

      // Description
      ctx.fillStyle = locked ? '#333' : '#999';
      ctx.font = '12px "Courier New", monospace';
      this.wrapText(ctx, loc.description, cx + 15, cy + 80, cardW - 30, 16);

      // Requires
      if (locked) {
        ctx.fillStyle = '#c83232';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`Requires Level ${loc.requiredLevel}`, cx + 15, cy + 170);
      } else {
        ctx.fillStyle = '#888';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`Payout: $${loc.payout}`, cx + 15, cy + 155);
        ctx.fillText(`Ghosts: ${loc.maxGhosts}`, cx + 15, cy + 175);
      }

      if (!locked) {
        this._locationButtons.push({ x: cx, y: cy, w: cardW, h: cardH, locationId: loc.id });
      }
    });

    // Back button
    this._backBtn = { x: W / 2 - 80, y: H - 70, w: 160, h: 40 };
    const bHover = game.mouseX >= this._backBtn.x && game.mouseX <= this._backBtn.x + 160 &&
                   game.mouseY >= this._backBtn.y && game.mouseY <= this._backBtn.y + 40;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    if (bHover) ctx.fillStyle = 'rgba(255,255,255,0.05)';
    else ctx.fillStyle = 'transparent';
    ctx.fillRect(this._backBtn.x, this._backBtn.y, 160, 40);
    ctx.strokeRect(this._backBtn.x, this._backBtn.y, 160, 40);
    ctx.fillStyle = '#888';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BACK', W / 2, this._backBtn.y + 26);
  },

  // --- Investigation ---
  drawInvestigation(ctx, W, H, game) {
    const loc = game.currentLocation;
    if (!loc) return;

    // Camera offset to center on player
    const camX = Math.max(0, Math.min(loc.width - W, game.player.x - W / 2));
    const camY = Math.max(0, Math.min(loc.height - H + 80, game.player.y - (H - 80) / 2));

    ctx.save();
    ctx.translate(-camX, -camY);

    // Floor
    ctx.fillStyle = loc.floorColor;
    ctx.fillRect(0, 0, loc.width, loc.height);

    // Rooms
    for (const room of loc.rooms) {
      ctx.fillStyle = room.color;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      // Walls
      ctx.strokeStyle = loc.wallColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(room.x, room.y, room.w, room.h);

      // Room name
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, room.x + room.w / 2, room.y + 18);
    }

    // Ambient light overlay
    const darkness = 1 - loc.ambientLight;
    // Player flashlight cone
    const gradient = ctx.createRadialGradient(
      game.player.x, game.player.y, 20,
      game.player.x, game.player.y, 200
    );
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(1, `rgba(0,0,0,${darkness})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, loc.width, loc.height);

    // Ghost orbs (floating particles near ghosts with orb evidence)
    for (const ghost of game.activeGhosts) {
      if (ghost.hasOrbs) {
        const orbT = Date.now() / 1000;
        for (let o = 0; o < 5; o++) {
          const ox = ghost.x + Math.sin(orbT * 1.5 + o * 1.3) * 40;
          const oy = ghost.y + Math.cos(orbT * 1.2 + o * 1.7) * 30;
          const oa = Math.sin(orbT * 2 + o) * 0.2 + 0.2;
          ctx.fillStyle = `rgba(220, 230, 255, ${oa})`;
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Ghosts
    for (const ghost of game.activeGhosts) {
      if (ghost.alpha > 0.02) {
        this.drawGhost(ctx, ghost, game);
      }
    }

    // Equipment readings
    for (const key of Object.keys(game.evidenceReadings)) {
      const reading = game.evidenceReadings[key];
      if (reading.active) {
        const eq = EQUIPMENT[key];
        const alpha = reading.timer / 1.5;
        const radius = eq.range * (1 - reading.timer / 1.5);
        ctx.strokeStyle = `rgba(${this.hexToRgb(eq.color)}, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(reading.x, reading.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Player
    this.drawPlayer(ctx, game);

    ctx.restore();

    // HUD (drawn on top, no camera offset)
    this.drawHUD(ctx, W, H, game);

    // Journal overlay
    if (game.showJournal) {
      this.drawJournal(ctx, W, H, game);
    }
  },

  drawPlayer(ctx, game) {
    const p = game.player;
    const t = Date.now() / 1000;

    // Flashlight glow
    ctx.fillStyle = 'rgba(255, 250, 230, 0.08)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#44aa66';
    ctx.fillRect(p.x - 6, p.y - 8, 12, 16);

    // Head
    ctx.fillStyle = '#55cc77';
    ctx.fillRect(p.x - 4, p.y - 14, 8, 8);

    // Active equipment indicator
    if (game.activeEquipment) {
      const eq = EQUIPMENT[game.activeEquipment];
      ctx.fillStyle = eq.color;
      ctx.fillRect(p.x + 8, p.y - 4, 6, 4);
    }

    // Sanity visual effect — screen edges darken when sanity is low
    if (game.sanity < 40) {
      const pulse = Math.sin(t * 3) * 0.1;
      ctx.fillStyle = `rgba(100, 0, 0, ${(1 - game.sanity / 40) * 0.3 + pulse})`;
      ctx.fillRect(p.x - 200, p.y - 200, 400, 400);
    }
  },

  drawGhost(ctx, ghost, game) {
    const t = Date.now() / 1000;
    const wobble = Math.sin(t * 3 + ghost.x) * 3;

    ctx.globalAlpha = ghost.alpha;

    // Ghost body — simple pixel-art shape
    const gx = ghost.x + wobble;
    const gy = ghost.y;
    const color = ghost.data.color;

    // Main body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(gx, gy - 8, 12, Math.PI, 0);
    ctx.lineTo(gx + 12, gy + 10);
    // Wavy bottom
    for (let i = 4; i >= -4; i -= 2) {
      const wave = Math.sin(t * 4 + i) * 3;
      ctx.lineTo(gx + i * 3, gy + 10 + wave);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = ghost.hunting ? '#ff0000' : '#ffffff';
    ctx.fillRect(gx - 6, gy - 10, 4, 4);
    ctx.fillRect(gx + 2, gy - 10, 4, 4);

    // Hunting aura
    if (ghost.hunting) {
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(t * 6) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, 25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  },

  drawHUD(ctx, W, H, game) {
    const hudY = H - 80;

    // HUD background
    ctx.fillStyle = 'rgba(5, 5, 15, 0.9)';
    ctx.fillRect(0, hudY, W, 80);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hudY);
    ctx.lineTo(W, hudY);
    ctx.stroke();

    ctx.textAlign = 'left';

    // Health bar
    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('HEALTH', 15, hudY + 18);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(15, hudY + 24, 120, 10);
    const healthPct = Math.max(0, game.health / game.save.maxHealth);
    ctx.fillStyle = healthPct > 0.5 ? '#32c864' : healthPct > 0.25 ? '#c8a032' : '#c83232';
    ctx.fillRect(15, hudY + 24, 120 * healthPct, 10);

    // Sanity bar
    ctx.fillStyle = '#888';
    ctx.fillText('SANITY', 15, hudY + 52);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(15, hudY + 58, 120, 10);
    const sanPct = Math.max(0, game.sanity / 100);
    ctx.fillStyle = sanPct > 0.5 ? '#4488ff' : sanPct > 0.25 ? '#aa44ff' : '#c83232';
    ctx.fillRect(15, hudY + 58, 120 * sanPct, 10);

    // Timer
    if (game.trainingActive) {
      ctx.fillStyle = '#32c864';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRAINING', W / 2, hudY + 30);
    } else {
      const mins = Math.floor(game.investigationTimer / 60);
      const secs = Math.floor(game.investigationTimer % 60);
      ctx.fillStyle = game.investigationTimer < 30 ? '#c83232' : '#e0e0e0';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, hudY + 30);
    }

    // Hunt warning
    if (game.huntActive) {
      const flash = Math.sin(Date.now() / 150) > 0;
      if (flash) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('⚠ HUNT ACTIVE ⚠', W / 2, hudY + 55);
      }
    }

    // Equipment slots
    const owned = game.getOwnedEquipment();
    const slotStartX = W - 350;
    ctx.textAlign = 'left';
    owned.forEach((eq, i) => {
      const sx = slotStartX + i * 82;
      const sy = hudY + 8;
      const active = game.activeEquipment === eq.id;
      const onCooldown = game.equipmentCooldowns[eq.id] && Date.now() < game.equipmentCooldowns[eq.id];

      ctx.strokeStyle = active ? eq.color : '#444';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(sx, sy, 74, 60);

      if (active) {
        ctx.fillStyle = `rgba(${this.hexToRgb(eq.color)}, 0.1)`;
        ctx.fillRect(sx, sy, 74, 60);
      }

      ctx.fillStyle = onCooldown ? '#555' : eq.color;
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText(`[${eq.key}]`, sx + 4, sy + 16);

      ctx.fillStyle = active ? '#e0e0e0' : '#888';
      ctx.font = '10px "Courier New", monospace';
      const shortName = eq.name.split(' ').map(w => w[0]).join('');
      ctx.fillText(shortName, sx + 28, sy + 16);

      // Cooldown bar
      if (onCooldown) {
        const remaining = (game.equipmentCooldowns[eq.id] - Date.now()) / EQUIPMENT[eq.id].cooldown;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(sx + 2, sy + 48, 70 * remaining, 6);
      }

      // Proficiency dot
      const prof = game.save.equipmentProficiency[eq.id] || 0;
      ctx.fillStyle = eq.color;
      ctx.globalAlpha = 0.3 + prof * 0.7;
      ctx.fillRect(sx + 4, sy + 42, Math.floor(prof * 66), 3);
      ctx.globalAlpha = 1;
    });

    // Evidence collected
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Evidence:', 160, hudY + 18);
    let evX = 235;
    for (const evType of Object.keys(EVIDENCE_TYPES)) {
      const found = game.collectedEvidence.has(evType);
      ctx.fillStyle = found ? EVIDENCE_TYPES[evType].color : '#333';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(EVIDENCE_TYPES[evType].name.substring(0, 6), evX, hudY + 18);
      evX += 55;
    }

    // Controls hint
    ctx.fillStyle = '#555';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | 1-4: Equipment | E: Use | J: Journal', W / 2, hudY + 72);

    // Notifications
    game.notifications.forEach((n, i) => {
      const age = Date.now() - n.time;
      const alpha = Math.max(0, 1 - age / 3000);
      ctx.fillStyle = n.error ? `rgba(200, 50, 50, ${alpha})` : `rgba(50, 200, 100, ${alpha})`;
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, W / 2, 30 + i * 24);
    });
  },

  drawJournal(ctx, W, H, game) {
    const jw = 340, jh = 420;
    const jx = W - jw - 20, jy = 20;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
    ctx.fillRect(jx, jy, jw, jh);
    ctx.strokeStyle = '#32c864';
    ctx.lineWidth = 1;
    ctx.strokeRect(jx, jy, jw, jh);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('JOURNAL', jx + 15, jy + 28);

    // Evidence collected
    ctx.fillStyle = '#aaa';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Evidence Found:', jx + 15, jy + 55);

    let ey = jy + 75;
    for (const evType of Object.keys(EVIDENCE_TYPES)) {
      const found = game.collectedEvidence.has(evType);
      ctx.fillStyle = found ? EVIDENCE_TYPES[evType].color : '#444';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText(`${found ? '✓' : '○'} ${EVIDENCE_TYPES[evType].name}`, jx + 20, ey);
      ey += 22;
    }

    // Ghost identification section
    ey += 15;
    ctx.fillStyle = '#aaa';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Identify Ghost:', jx + 15, ey);
    ey += 10;

    // Ghost guess buttons
    this._ghostGuessButtons = [];
    const ghostList = Object.values(GHOSTS);
    ghostList.forEach((ghost, i) => {
      const bx = jx + 15 + (i % 2) * 155;
      const by = ey + 10 + Math.floor(i / 2) * 38;
      const bw = 145, bh = 32;

      // Check if this ghost matches collected evidence
      const evidenceMatch = ghost.evidence.every(e => game.collectedEvidence.has(e)) &&
        [...game.collectedEvidence].every(e => ghost.evidence.includes(e));

      const hover = game.mouseX >= bx && game.mouseX <= bx + bw &&
                    game.mouseY >= by && game.mouseY <= by + bh;

      ctx.strokeStyle = evidenceMatch ? '#32c864' : (hover ? '#888' : '#444');
      ctx.lineWidth = 1;
      if (hover || evidenceMatch) {
        ctx.fillStyle = evidenceMatch ? 'rgba(50,200,100,0.1)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(bx, by, bw, bh);
      }
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = evidenceMatch ? '#32c864' : '#aaa';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(ghost.name, bx + 10, by + 20);

      // Show evidence requirements as small dots
      ctx.font = '8px "Courier New", monospace';
      ctx.fillStyle = '#666';
      const evNames = ghost.evidence.map(e => EVIDENCE_TYPES[e].name.substring(0, 3)).join(' ');
      ctx.fillText(evNames, bx + 10, by + 30);

      this._ghostGuessButtons.push({ x: bx, y: by, w: bw, h: bh, ghostId: ghost.id });
    });

    // Capture button
    if (game.collectedEvidence.size >= 2) {
      const capY = ey + 120;
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Click a ghost name to attempt capture', jx + 15, capY);
    }

    // Close hint
    ctx.fillStyle = '#555';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press J to close', jx + jw / 2, jy + jh - 10);
  },

  // --- Results Screen ---
  drawResults(ctx, W, H, game) {
    ctx.fillStyle = 'rgba(5, 5, 15, 0.97)';
    ctx.fillRect(0, 0, W, H);

    const r = game.resultData;
    if (!r) return;

    ctx.textAlign = 'center';

    if (r.success) {
      ctx.fillStyle = '#32c864';
      ctx.shadowColor = 'rgba(50, 200, 100, 0.5)';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText('GHOST CAPTURED!', W / 2, 160);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#e0e0e0';
      ctx.font = '20px "Courier New", monospace';
      ctx.fillText(r.ghost.name, W / 2, 210);

      ctx.fillStyle = '#aaa';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(`Tier ${r.ghost.tier} — ${r.ghost.danger} Danger`, W / 2, 240);

      ctx.fillStyle = '#c8a032';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText(`+${r.xp} XP    +$${r.currency}`, W / 2, 290);
    } else {
      ctx.fillStyle = '#c83232';
      ctx.shadowColor = 'rgba(200, 50, 50, 0.5)';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText('INVESTIGATION FAILED', W / 2, 160);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#aaa';
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText(r.reason || 'Unknown failure', W / 2, 210);

      if (r.xp > 0) {
        ctx.fillStyle = '#888';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText(`+${r.xp} XP (partial)`, W / 2, 260);
      }
    }

    ctx.fillStyle = '#888';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`Evidence collected: ${r.evidenceCount}`, W / 2, 340);

    // Continue button
    this._continueBtn = { x: W / 2 - 100, y: 400, w: 200, h: 44 };
    const hover = game.mouseX >= this._continueBtn.x && game.mouseX <= this._continueBtn.x + 200 &&
                  game.mouseY >= this._continueBtn.y && game.mouseY <= this._continueBtn.y + 44;
    ctx.strokeStyle = '#32c864';
    ctx.lineWidth = 1;
    if (hover) {
      ctx.fillStyle = 'rgba(50,200,100,0.15)';
      ctx.fillRect(this._continueBtn.x, this._continueBtn.y, 200, 44);
    }
    ctx.strokeRect(this._continueBtn.x, this._continueBtn.y, 200, 44);
    ctx.fillStyle = '#32c864';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('CONTINUE', W / 2, this._continueBtn.y + 28);
  },

  // --- Skills Screen ---
  drawSkills(ctx, W, H, game) {
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('SKILLS', W / 2, 50);

    ctx.fillStyle = '#888';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`Currency: $${game.save.currency}    Level: ${game.save.level}    XP: ${game.save.xp}/${LEVEL_XP[game.save.level] || '???'}`, W / 2, 80);

    this._skillButtons = [];
    const skillList = Object.entries(SKILLS);
    const cardW = 400, cardH = 70;
    const startY = 110;

    skillList.forEach(([id, skill], i) => {
      const cy = startY + i * (cardH + 15);
      const cx = W / 2 - cardW / 2;
      const level = game.save.skills[id] || 0;
      const cost = skillUpgradeCost(level);
      const canUpgrade = level < skill.maxLevel && game.save.currency >= cost;

      ctx.fillStyle = 'rgba(10,10,20,0.8)';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Name and level
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(`${skill.name} [${level}/${skill.maxLevel}]`, cx + 15, cy + 24);

      // Description
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(skill.description, cx + 15, cy + 42);

      // Progress bar
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cx + 15, cy + 50, 250, 8);
      ctx.fillStyle = '#32c864';
      ctx.fillRect(cx + 15, cy + 50, 250 * (level / skill.maxLevel), 8);

      // Upgrade button
      if (level < skill.maxLevel) {
        const bx = cx + cardW - 110, by = cy + 15, bw = 95, bh = 40;
        const hover = game.mouseX >= bx && game.mouseX <= bx + bw &&
                      game.mouseY >= by && game.mouseY <= by + bh;
        ctx.strokeStyle = canUpgrade ? '#32c864' : '#444';
        if (hover && canUpgrade) {
          ctx.fillStyle = 'rgba(50,200,100,0.15)';
          ctx.fillRect(bx, by, bw, bh);
        }
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = canUpgrade ? '#32c864' : '#555';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`$${cost}`, bx + bw / 2, by + 16);
        ctx.fillText('UPGRADE', bx + bw / 2, by + 32);

        this._skillButtons.push({ x: bx, y: by, w: bw, h: bh, skillId: id, canUpgrade });
      }
    });

    // Back button
    this._backBtn = { x: W / 2 - 80, y: H - 70, w: 160, h: 40 };
    this.drawBackButton(ctx, W, H, game);
  },

  // --- Shop Screen ---
  drawShop(ctx, W, H, game) {
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('EQUIPMENT SHOP', W / 2, 50);

    ctx.fillStyle = '#888';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`Currency: $${game.save.currency}`, W / 2, 80);

    this._shopButtons = [];
    const eqList = Object.values(EQUIPMENT);
    const cardW = 420, cardH = 80;
    const startY = 110;

    eqList.forEach((eq, i) => {
      const cy = startY + i * (cardH + 12);
      const cx = W / 2 - cardW / 2;
      const owned = game.save.equipment[eq.id];

      ctx.fillStyle = 'rgba(10,10,20,0.8)';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = owned ? '#32c864' : '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Color indicator
      ctx.fillStyle = eq.color;
      ctx.fillRect(cx, cy, 4, cardH);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(eq.name, cx + 15, cy + 24);

      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(eq.description, cx + 15, cy + 42);

      ctx.fillText(`Detects: ${EVIDENCE_TYPES[eq.evidence].name}  |  Range: ${eq.range}  |  Key: [${eq.key}]`, cx + 15, cy + 62);

      // Proficiency bar
      const prof = game.save.equipmentProficiency[eq.id] || 0;
      if (owned && prof > 0) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(cx + 15, cy + 68, 100, 4);
        ctx.fillStyle = eq.color;
        ctx.fillRect(cx + 15, cy + 68, 100 * prof, 4);
      }

      // Buy button or owned badge
      if (owned) {
        ctx.fillStyle = '#32c864';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('OWNED', cx + cardW - 15, cy + 35);
      } else {
        const bx = cx + cardW - 100, by = cy + 15, bw = 85, bh = 48;
        const canBuy = game.save.currency >= eq.cost;
        const hover = game.mouseX >= bx && game.mouseX <= bx + bw &&
                      game.mouseY >= by && game.mouseY <= by + bh;
        ctx.strokeStyle = canBuy ? '#c8a032' : '#444';
        if (hover && canBuy) {
          ctx.fillStyle = 'rgba(200,160,50,0.15)';
          ctx.fillRect(bx, by, bw, bh);
        }
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = canBuy ? '#c8a032' : '#555';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`$${eq.cost}`, bx + bw / 2, by + 20);
        ctx.fillText('BUY', bx + bw / 2, by + 38);

        this._shopButtons.push({ x: bx, y: by, w: bw, h: bh, eqId: eq.id, canBuy });
      }
    });

    // Heal button
    if (game.save.health < game.save.maxHealth) {
      const hx = W / 2 - 100, hy = startY + eqList.length * (cardH + 12) + 10;
      const canHeal = game.save.currency >= 50;
      const hover = game.mouseX >= hx && game.mouseX <= hx + 200 &&
                    game.mouseY >= hy && game.mouseY <= hy + 40;
      ctx.strokeStyle = canHeal ? '#44aa88' : '#444';
      if (hover && canHeal) {
        ctx.fillStyle = 'rgba(68,170,136,0.15)';
        ctx.fillRect(hx, hy, 200, 40);
      }
      ctx.strokeRect(hx, hy, 200, 40);
      ctx.fillStyle = canHeal ? '#44aa88' : '#555';
      ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`HEAL ($50) — HP: ${game.save.health}/${game.save.maxHealth}`, hx + 100, hy + 26);

      this._healBtn = { x: hx, y: hy, w: 200, h: 40, canHeal };
    } else {
      this._healBtn = null;
    }

    // Back button
    this._backBtn = { x: W / 2 - 80, y: H - 70, w: 160, h: 40 };
    this.drawBackButton(ctx, W, H, game);
  },

  // --- Bestiary ---
  drawBestiary(ctx, W, H, game) {
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('BESTIARY', W / 2, 50);

    const ghostList = Object.values(GHOSTS);
    const cardW = 400, cardH = 90;
    const startY = 90;

    ghostList.forEach((ghost, i) => {
      const cy = startY + i * (cardH + 10);
      const cx = W / 2 - cardW / 2;
      const entry = game.save.bestiary[ghost.id];
      const seen = entry?.seen;

      ctx.fillStyle = 'rgba(10,10,20,0.8)';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = seen ? ghost.color : '#222';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Color bar
      ctx.fillStyle = seen ? ghost.color : '#333';
      ctx.fillRect(cx, cy, 4, cardH);

      ctx.textAlign = 'left';

      if (seen) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText(ghost.name, cx + 15, cy + 24);

        ctx.fillStyle = '#888';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText(`Tier ${ghost.tier} | ${ghost.danger} Danger | Captured: ${entry?.captured || 0}`, cx + 15, cy + 42);
        ctx.fillText(ghost.description, cx + 15, cy + 60);

        ctx.fillStyle = '#666';
        ctx.fillText(`Evidence: ${ghost.evidence.map(e => EVIDENCE_TYPES[e].name).join(', ')}`, cx + 15, cy + 78);
      } else {
        ctx.fillStyle = '#444';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('???', cx + 15, cy + 24);
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('Not yet encountered', cx + 15, cy + 42);
      }
    });

    this._backBtn = { x: W / 2 - 80, y: H - 70, w: 160, h: 40 };
    this.drawBackButton(ctx, W, H, game);
  },

  // --- Training Overlay ---
  drawTrainingOverlay(ctx, W, H, game) {
    const step = TRAINING_STEPS[game.trainingStep];
    if (!step) return;

    const isDialogStep = step.action === 'click_continue' || step.action === 'click_finish';

    // Progress bar at top
    const progress = game.trainingStep / (TRAINING_STEPS.length - 1);
    ctx.fillStyle = 'rgba(5, 5, 15, 0.6)';
    ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = '#32c864';
    ctx.fillRect(0, 0, W * progress, 6);

    // Step counter
    ctx.fillStyle = '#555';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Step ${game.trainingStep + 1}/${TRAINING_STEPS.length}`, W - 15, 20);

    // "TRAINING MODE" label
    ctx.fillStyle = 'rgba(50, 200, 100, 0.6)';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TRAINING MODE', 15, 20);

    // Highlight active element
    if (step.highlight === 'player') {
      this.drawPulsingRing(ctx, game.player.x, game.player.y, 25, '#32c864');
      // Also highlight target room
      if (step.targetRoom !== undefined) {
        const room = TRAINING_LOCATION.rooms[step.targetRoom];
        const camX = Math.max(0, Math.min(TRAINING_LOCATION.width - W, game.player.x - W / 2));
        const camY = Math.max(0, Math.min(TRAINING_LOCATION.height - H + 80, game.player.y - (H - 80) / 2));
        this.drawPulsingRect(ctx, room.x - camX, room.y - camY, room.w, room.h, '#32c864');
      }
    } else if (step.highlight === 'equipment') {
      // Pulse around equipment HUD area
      const hudY = H - 80;
      this.drawPulsingRect(ctx, W - 355, hudY + 3, 340, 70, '#ffaa00');
    } else if (step.highlight === 'use_key') {
      // Pulse "E" key hint near player
      const t = Date.now() / 1000;
      const bounce = Math.sin(t * 3) * 4;
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press E', W / 2, H - 110 + bounce);
    } else if (step.highlight === 'journal_key') {
      const t = Date.now() / 1000;
      const bounce = Math.sin(t * 3) * 4;
      ctx.fillStyle = '#32c864';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press J', W / 2, H - 110 + bounce);
    } else if (step.highlight === 'journal' && game.showJournal) {
      // Pulse around journal panel
      this.drawPulsingRect(ctx, W - 365, 15, 350, 430, '#32c864');
    }

    // Dialog box — always shown at top of screen
    const boxW = 500, boxH = isDialogStep ? 160 : 100;
    const boxX = (W - boxW) / 2, boxY = 30;

    // Background
    ctx.fillStyle = 'rgba(5, 10, 20, 0.92)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#32c864';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Corner accents
    const cornerLen = 12;
    ctx.strokeStyle = '#32c864';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cornerLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cornerLen, boxY);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - cornerLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cornerLen, boxY + boxH);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#32c864';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(step.title, boxX + 18, boxY + 28);

    // Body text (wrapped)
    ctx.fillStyle = '#ccc';
    ctx.font = '12px "Courier New", monospace';
    this.wrapText(ctx, step.text, boxX + 18, boxY + 50, boxW - 36, 17);

    // Continue button for dialog steps
    if (isDialogStep) {
      const btnLabel = step.action === 'click_finish' ? 'FINISH' : 'CONTINUE';
      const btnW = 140, btnH = 34;
      const btnX = boxX + boxW / 2 - btnW / 2;
      const btnY = boxY + boxH - 48;

      const hover = game.mouseX >= btnX && game.mouseX <= btnX + btnW &&
                    game.mouseY >= btnY && game.mouseY <= btnY + btnH;

      ctx.strokeStyle = '#32c864';
      ctx.lineWidth = 1;
      if (hover) {
        ctx.fillStyle = 'rgba(50, 200, 100, 0.2)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.shadowColor = 'rgba(50, 200, 100, 0.3)';
        ctx.shadowBlur = 10;
      }
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#32c864';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btnLabel, btnX + btnW / 2, btnY + 22);

      this._trainingContinueBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    } else {
      this._trainingContinueBtn = null;
    }
  },

  drawPulsingRing(ctx, x, y, radius, color) {
    const t = Date.now() / 1000;
    const pulse = Math.sin(t * 4) * 0.3 + 0.5;
    const r2 = radius + Math.sin(t * 3) * 5;
    ctx.strokeStyle = color;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  drawPulsingRect(ctx, x, y, w, h, color) {
    const t = Date.now() / 1000;
    const pulse = Math.sin(t * 4) * 0.25 + 0.45;
    ctx.strokeStyle = color;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  // --- Helpers ---
  drawBackButton(ctx, W, H, game) {
    const b = this._backBtn;
    const hover = game.mouseX >= b.x && game.mouseX <= b.x + b.w &&
                  game.mouseY >= b.y && game.mouseY <= b.y + b.h;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    if (hover) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#888';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BACK', W / 2, b.y + 26);
  },

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, cy);
  },

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  },
};
