// ============================================================
// Ghost Hunter — Game Engine
// ============================================================

const Game = {
  canvas: null,
  ctx: null,
  state: 'menu', // menu, location_select, briefing, investigating, training, hunt, results, skills, shop, bestiary
  save: null,
  currentLocation: null,
  activeGhosts: [],
  collectedEvidence: new Set(),
  player: { x: 400, y: 300, speed: 3, radius: 12 },
  activeEquipment: null,
  equipmentCooldowns: {},
  keys: {},
  mouseX: 0,
  mouseY: 0,
  sanity: 100,
  health: 100,
  investigationTimer: 0,
  maxInvestigationTime: 180, // seconds
  huntActive: false,
  huntTimer: 0,
  huntCooldown: 0,
  notifications: [],
  lastTime: 0,
  evidenceReadings: {}, // equipment_id -> { active, timer, result }
  ghostPositions: [],
  flickerTimer: 0,
  ambientSounds: 0,
  captureAttempted: false,
  selectedGhostGuess: null,
  showJournal: false,
  showResults: false,
  resultData: null,
  paused: false,

  // Training state
  trainingActive: false,
  trainingStep: 0,
  trainingStepComplete: false,
  trainingGhostRevealed: false,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.loadSave();
    this.bindInput();
    this.lastTime = performance.now();
    this.loop();
  },

  // --- Save System ---
  loadSave() {
    const raw = localStorage.getItem('ghosthunter_save');
    if (raw) {
      try {
        this.save = JSON.parse(raw);
        // Merge in any new fields from default save
        const defaults = getDefaultSave();
        for (const key of Object.keys(defaults)) {
          if (!(key in this.save)) this.save[key] = defaults[key];
        }
      } catch {
        this.save = getDefaultSave();
      }
    } else {
      this.save = getDefaultSave();
    }
  },

  persistSave() {
    localStorage.setItem('ghosthunter_save', JSON.stringify(this.save));
  },

  deleteSave() {
    localStorage.removeItem('ghosthunter_save');
    this.save = getDefaultSave();
  },

  // --- Input ---
  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (this.state === 'investigating' || this.state === 'training') {
        // Equipment hotkeys
        if (e.key >= '1' && e.key <= '4') {
          this.switchEquipment(e.key);
          if (this.trainingActive) this.checkTrainingInput('equip_' + e.key);
        }
        if (e.key.toLowerCase() === 'j') {
          this.showJournal = !this.showJournal;
          if (this.trainingActive && this.showJournal) this.checkTrainingInput('open_journal');
        }
        if (e.key.toLowerCase() === 'e') {
          this.useEquipment();
          if (this.trainingActive) this.checkTrainingInput('use_equipment');
        }
        if (e.key === 'Escape') {
          this.showJournal = false;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.handleClick(mx, my);
    });
  },

  // --- Equipment ---
  switchEquipment(key) {
    const equipList = this.getOwnedEquipment();
    const index = parseInt(key) - 1;
    if (index < equipList.length) {
      this.activeEquipment = equipList[index].id;
    }
  },

  getOwnedEquipment() {
    return Object.keys(EQUIPMENT)
      .filter((id) => this.save.equipment[id])
      .map((id) => EQUIPMENT[id]);
  },

  useEquipment() {
    if (!this.activeEquipment) return;
    const eq = EQUIPMENT[this.activeEquipment];
    if (!eq) return;

    // Check cooldown
    const now = Date.now();
    if (this.equipmentCooldowns[eq.id] && now < this.equipmentCooldowns[eq.id]) return;

    this.equipmentCooldowns[eq.id] = now + eq.cooldown;

    // Calculate effective range
    const detectionLevel = this.save.skills.detection || 0;
    const proficiency = this.save.equipmentProficiency[eq.id] || 0;
    const rangeBonus = SKILLS.detection.effect(detectionLevel).rangeBonus;
    const effectiveRange = eq.range * (1 + rangeBonus + proficiency * 0.3);

    // Check each ghost
    let foundEvidence = false;
    for (const ghost of this.activeGhosts) {
      const dist = Math.hypot(ghost.x - this.player.x, ghost.y - this.player.y);
      if (dist <= effectiveRange && ghost.data.evidence.includes(eq.evidence)) {
        // Evidence speed bonus
        const idLevel = this.save.skills.identification || 0;
        const speedBonus = SKILLS.identification.effect(idLevel).evidenceSpeedBonus;
        let detectChance = 0.4 + speedBonus + proficiency * 0.2;
        if (this.trainingActive) detectChance = 0.85; // High success in training

        if (Math.random() < detectChance) {
          if (!this.collectedEvidence.has(eq.evidence)) {
            this.collectedEvidence.add(eq.evidence);
            this.notify(`Evidence found: ${EVIDENCE_TYPES[eq.evidence].name}!`);
            foundEvidence = true;
          } else {
            this.notify(`${EVIDENCE_TYPES[eq.evidence].name} confirmed.`);
          }
        } else {
          this.notify(`${eq.name}: Inconclusive reading...`);
        }
      }
    }

    if (!foundEvidence && !this.collectedEvidence.has(eq.evidence)) {
      // Check if ghost has orb evidence (passive detection)
      this.notify(`${eq.name}: No activity detected nearby.`);
    }

    // Gain proficiency
    this.save.equipmentProficiency[eq.id] = Math.min(
      1,
      (this.save.equipmentProficiency[eq.id] || 0) + eq.proficiencyGain
    );

    // Start reading animation
    this.evidenceReadings[eq.id] = { active: true, timer: 1.5, x: this.player.x, y: this.player.y };
  },

  // --- Investigation Setup ---
  startInvestigation(locationId) {
    const loc = LOCATIONS[locationId];
    if (!loc) return;
    if (this.save.level < loc.requiredLevel) {
      this.notify('Level too low for this location!');
      return;
    }

    this.currentLocation = loc;
    this.state = 'investigating';
    this.collectedEvidence = new Set();
    this.activeEquipment = this.getOwnedEquipment()[0]?.id || null;
    this.investigationTimer = this.maxInvestigationTime;
    this.huntActive = false;
    this.huntTimer = 0;
    this.huntCooldown = 30;
    this.sanity = 100;
    this.health = this.save.health;
    this.captureAttempted = false;
    this.selectedGhostGuess = null;
    this.showJournal = false;
    this.showResults = false;
    this.equipmentCooldowns = {};
    this.evidenceReadings = {};
    this.ghostPositions = [];
    this.paused = false;

    // Spawn player at center of first room
    const firstRoom = loc.rooms[0];
    this.player.x = firstRoom.x + firstRoom.w / 2;
    this.player.y = firstRoom.y + firstRoom.h / 2;

    // Spawn ghosts
    this.activeGhosts = [];
    const pool = [...loc.ghostPool];
    const count = Math.min(loc.maxGhosts, pool.length);
    for (let i = 0; i < count; i++) {
      const ghostId = pool[Math.floor(Math.random() * pool.length)];
      const ghostData = GHOSTS[ghostId];
      const room = loc.rooms[Math.floor(Math.random() * loc.rooms.length)];
      this.activeGhosts.push({
        data: ghostData,
        x: room.x + room.w / 2 + (Math.random() - 0.5) * 60,
        y: room.y + room.h / 2 + (Math.random() - 0.5) * 60,
        targetX: 0,
        targetY: 0,
        moveTimer: 0,
        visible: false,
        visibleTimer: 0,
        hunting: false,
        alpha: 0,
      });
    }

    // Check for passive orb evidence
    for (const ghost of this.activeGhosts) {
      if (ghost.data.evidence.includes('ORBS')) {
        // Orbs will appear passively over time
        ghost.hasOrbs = true;
      }
    }
  },

  // --- Training System ---
  startTraining() {
    this.trainingActive = true;
    this.trainingStep = 0;
    this.trainingStepComplete = false;
    this.trainingGhostRevealed = false;
    this.state = 'training';

    // Set up the training location using the investigation setup but with overrides
    this.currentLocation = TRAINING_LOCATION;
    this.collectedEvidence = new Set();
    this.activeEquipment = null;
    this.investigationTimer = 999;
    this.huntActive = false;
    this.huntTimer = 0;
    this.huntCooldown = 9999; // No hunts during training
    this.sanity = 100;
    this.health = 100;
    this.captureAttempted = false;
    this.selectedGhostGuess = null;
    this.showJournal = false;
    this.equipmentCooldowns = {};
    this.evidenceReadings = {};
    this.paused = false;

    // Spawn player
    const firstRoom = TRAINING_LOCATION.rooms[0];
    this.player.x = firstRoom.x + firstRoom.w / 2;
    this.player.y = firstRoom.y + firstRoom.h / 2;

    // No ghost spawned yet — spawns at step 3 (use_equipment)
    this.activeGhosts = [];

    // Temporarily give all starter equipment for training
    this._realEquipment = { ...this.save.equipment };
    this.save.equipment = {
      emf_reader: true,
      spirit_box: true,
      thermal_cam: false,
      uv_light: false,
    };
  },

  spawnTrainingGhost() {
    const ghostData = GHOSTS.shade;
    const room = TRAINING_LOCATION.rooms[1]; // Room B
    this.activeGhosts = [{
      data: ghostData,
      x: room.x + room.w / 2,
      y: room.y + room.h / 2,
      targetX: room.x + room.w / 2,
      targetY: room.y + room.h / 2,
      moveTimer: 999, // Stays put during training
      visible: true,
      visibleTimer: 999,
      hunting: false,
      alpha: 0.5,
    }];
    this.trainingGhostRevealed = true;
  },

  checkTrainingInput(action) {
    const step = TRAINING_STEPS[this.trainingStep];
    if (!step) return;

    switch (step.action) {
      case 'select_emf':
        if (action === 'equip_1' && this.activeEquipment === 'emf_reader') {
          this.advanceTraining();
        }
        break;
      case 'find_evidence':
        if (action === 'use_equipment' && this.collectedEvidence.size > 0) {
          this.advanceTraining();
        }
        break;
      case 'use_spirit_box':
        if (action === 'use_equipment' && this.activeEquipment === 'spirit_box') {
          // Count it even if evidence wasn't found — they used the right tool
          this.advanceTraining();
        }
        break;
      case 'open_journal':
        if (action === 'open_journal') {
          this.advanceTraining();
        }
        break;
    }
  },

  checkTrainingMovement() {
    const step = TRAINING_STEPS[this.trainingStep];
    if (!step || step.action !== 'move_to_room_b') return;

    const targetRoom = TRAINING_LOCATION.rooms[step.targetRoom];
    const inRoom = this.player.x >= targetRoom.x && this.player.x <= targetRoom.x + targetRoom.w &&
                   this.player.y >= targetRoom.y && this.player.y <= targetRoom.y + targetRoom.h;
    if (inRoom) {
      this.advanceTraining();
    }
  },

  advanceTraining() {
    this.trainingStep++;
    if (this.trainingStep >= TRAINING_STEPS.length) {
      this.endTraining();
      return;
    }

    const newStep = TRAINING_STEPS[this.trainingStep];

    // Side effects on step entry
    if (newStep.id === 'use_equipment' && !this.trainingGhostRevealed) {
      this.spawnTrainingGhost();
      this.notify('A training ghost has appeared in Room B!');
    }

    // Pre-collect evidence for the spirit box step so journal has something to show
    if (newStep.id === 'journal_intro') {
      // Ensure they have at least EMF evidence for the journal demo
      if (!this.collectedEvidence.has('EMF')) {
        this.collectedEvidence.add('EMF');
      }
    }
  },

  trainingClickContinue() {
    const step = TRAINING_STEPS[this.trainingStep];
    if (!step) return;
    if (step.action === 'click_continue' || step.action === 'click_finish') {
      this.advanceTraining();
    }
  },

  trainingAttemptCapture(ghostId) {
    const step = TRAINING_STEPS[this.trainingStep];
    if (!step || step.action !== 'attempt_capture') return;

    // In training, always succeed on correct guess and guide on wrong guess
    const actualGhost = this.activeGhosts[0]?.data;
    if (!actualGhost) return;

    if (actualGhost.id === ghostId) {
      this.notify('Correct! Ghost identified and captured!');
      this.advanceTraining();
    } else {
      this.notify(`That's not right — check your evidence again.`);
    }
  },

  endTraining() {
    // Restore real equipment
    if (this._realEquipment) {
      this.save.equipment = this._realEquipment;
      this._realEquipment = null;
    }
    this.trainingActive = false;
    this.save.trainingComplete = true;
    this.persistSave();
    this.state = 'menu';
    this.notify('Training complete! You\'re ready for the field.');
  },

  // --- Game Loop ---
  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if ((this.state === 'investigating' || this.state === 'training') && !this.paused) {
      this.updateInvestigation(dt);
      if (this.trainingActive) {
        this.checkTrainingMovement();
      }
    }

    Renderer.draw(this);
    requestAnimationFrame(() => this.loop());
  },

  updateInvestigation(dt) {
    // Move player
    this.movePlayer(dt);

    // Update timer (frozen in training)
    if (!this.trainingActive) {
      this.investigationTimer -= dt;
      if (this.investigationTimer <= 0) {
        this.endInvestigation(false, 'Time ran out!');
        return;
      }
    }

    // Update ghosts
    this.updateGhosts(dt);

    // Update evidence readings
    for (const key of Object.keys(this.evidenceReadings)) {
      const reading = this.evidenceReadings[key];
      if (reading.active) {
        reading.timer -= dt;
        if (reading.timer <= 0) reading.active = false;
      }
    }

    // Sanity drain (disabled in training)
    if (!this.trainingActive) {
      this.updateSanity(dt);
    }

    // Hunt mechanic (disabled in training)
    if (!this.trainingActive) {
      this.updateHunt(dt);
    }

    // Passive orb detection
    this.updateOrbs(dt);

    // Flicker effects
    this.flickerTimer += dt;

    // Check health
    if (this.health <= 0) {
      this.endInvestigation(false, 'You have been overwhelmed!');
    }

    // Remove expired notifications
    this.notifications = this.notifications.filter((n) => Date.now() - n.time < 3000);
  },

  movePlayer(dt) {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const speed = this.huntActive ? this.player.speed * 1.3 : this.player.speed;
      const newX = this.player.x + dx * speed * 60 * dt;
      const newY = this.player.y + dy * speed * 60 * dt;

      // Clamp to location bounds
      this.player.x = Math.max(10, Math.min(this.currentLocation.width - 10, newX));
      this.player.y = Math.max(10, Math.min(this.currentLocation.height - 10, newY));
    }
  },

  updateGhosts(dt) {
    for (const ghost of this.activeGhosts) {
      // Random movement
      ghost.moveTimer -= dt;
      if (ghost.moveTimer <= 0) {
        const room = this.currentLocation.rooms[Math.floor(Math.random() * this.currentLocation.rooms.length)];
        ghost.targetX = room.x + Math.random() * room.w;
        ghost.targetY = room.y + Math.random() * room.h;
        ghost.moveTimer = 3 + Math.random() * 5;
      }

      // Move toward target
      const dx = ghost.targetX - ghost.x;
      const dy = ghost.targetY - ghost.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const speed = ghost.hunting ? ghost.data.speed * 80 : ghost.data.speed * 30;
        ghost.x += (dx / dist) * speed * dt;
        ghost.y += (dy / dist) * speed * dt;
      }

      // If hunting, target player
      if (ghost.hunting) {
        ghost.targetX = this.player.x;
        ghost.targetY = this.player.y;

        // Check collision
        const pDist = Math.hypot(ghost.x - this.player.x, ghost.y - this.player.y);
        if (pDist < 30) {
          this.health -= 15 * dt;
          this.sanity -= 10 * dt;
        }
      }

      // Random visibility flicker
      ghost.visibleTimer -= dt;
      if (ghost.visibleTimer <= 0) {
        ghost.visible = Math.random() < 0.15;
        ghost.visibleTimer = 0.5 + Math.random() * 2;
      }

      // Alpha for rendering
      const targetAlpha = ghost.visible || ghost.hunting ? (ghost.hunting ? 0.8 : 0.4) : 0;
      ghost.alpha += (targetAlpha - ghost.alpha) * dt * 3;
    }
  },

  updateSanity(dt) {
    // Base drain
    let drain = 0.3;

    // Proximity drain
    for (const ghost of this.activeGhosts) {
      const dist = Math.hypot(ghost.x - this.player.x, ghost.y - this.player.y);
      if (dist < 150) {
        drain += (1 - dist / 150) * 2;
      }
    }

    // Resilience reduction
    const resLevel = this.save.skills.resilience || 0;
    const reduction = SKILLS.resilience.effect(resLevel).sanityDrainReduction;
    drain *= (1 - reduction);

    this.sanity = Math.max(0, this.sanity - drain * dt);
  },

  updateHunt(dt) {
    if (this.huntActive) {
      this.huntTimer -= dt;
      if (this.huntTimer <= 0) {
        this.huntActive = false;
        this.huntCooldown = 20 + Math.random() * 20;
        for (const ghost of this.activeGhosts) {
          ghost.hunting = false;
        }
      }
      return;
    }

    this.huntCooldown -= dt;
    if (this.huntCooldown <= 0) {
      // Check if any ghost triggers a hunt
      for (const ghost of this.activeGhosts) {
        const threshold = ghost.data.huntThreshold;
        if (this.sanity / 100 <= threshold && Math.random() < ghost.data.aggressionChance) {
          this.startHunt(ghost);
          break;
        }
      }
      this.huntCooldown = 5;
    }
  },

  startHunt(ghost) {
    this.huntActive = true;
    this.huntTimer = 8 + Math.random() * 7;
    ghost.hunting = true;
    ghost.visible = true;
    ghost.alpha = 0.8;
    this.notify('⚠ GHOST HUNT — RUN AND HIDE!');
  },

  updateOrbs(dt) {
    for (const ghost of this.activeGhosts) {
      if (ghost.hasOrbs) {
        const dist = Math.hypot(ghost.x - this.player.x, ghost.y - this.player.y);
        if (dist < 200 && Math.random() < 0.005) {
          if (!this.collectedEvidence.has('ORBS')) {
            this.collectedEvidence.add('ORBS');
            this.notify('Evidence found: Ghost Orbs spotted!');
          }
        }
      }
    }
  },

  // --- Capture / Identification ---
  attemptCapture(ghostId) {
    if (this.captureAttempted) return;
    this.captureAttempted = true;

    const actualGhost = this.activeGhosts[0]?.data;
    if (!actualGhost) return;

    const correct = actualGhost.id === ghostId;
    const captureLevel = this.save.skills.capture || 0;
    const captureBonus = SKILLS.capture.effect(captureLevel).captureBonus;

    let success = false;
    if (correct) {
      // Base 60% + capture bonus
      success = Math.random() < (0.6 + captureBonus);
    }

    if (correct && success) {
      const xp = actualGhost.baseXP;
      const currency = this.currentLocation.payout;
      this.endInvestigation(true, null, { xp, currency, ghost: actualGhost });
    } else if (correct && !success) {
      this.notify('Capture failed! The ghost escaped.');
      this.health -= 20;
      this.endInvestigation(false, 'The ghost escaped during capture!');
    } else {
      this.health -= 30;
      this.notify('Wrong identification! The ghost is enraged!');
      this.endInvestigation(false, `Wrong ghost! It was a ${actualGhost.name}.`);
    }
  },

  endInvestigation(success, failReason, rewards) {
    this.state = 'results';
    this.huntActive = false;

    if (success && rewards) {
      this.save.xp += rewards.xp;
      this.save.currency += rewards.currency;
      this.save.ghostsCaptured++;
      this.save.huntsCompleted++;

      // Update bestiary
      const gId = rewards.ghost.id;
      if (!this.save.bestiary[gId]) this.save.bestiary[gId] = { seen: true, captured: 0 };
      this.save.bestiary[gId].captured++;
      this.save.bestiary[gId].seen = true;

      // Check level up
      this.checkLevelUp();

      this.resultData = {
        success: true,
        ghost: rewards.ghost,
        xp: rewards.xp,
        currency: rewards.currency,
        evidenceCount: this.collectedEvidence.size,
      };
    } else {
      this.save.huntsCompleted++;
      // Partial XP for trying
      const partialXP = Math.floor(this.collectedEvidence.size * 10);
      this.save.xp += partialXP;

      // Mark ghosts as seen
      for (const ghost of this.activeGhosts) {
        const gId = ghost.data.id;
        if (!this.save.bestiary[gId]) this.save.bestiary[gId] = { seen: true, captured: 0 };
        this.save.bestiary[gId].seen = true;
      }

      this.checkLevelUp();

      this.resultData = {
        success: false,
        reason: failReason,
        xp: partialXP,
        evidenceCount: this.collectedEvidence.size,
      };
    }

    this.save.health = Math.max(20, Math.floor(this.health));
    this.persistSave();
  },

  checkLevelUp() {
    const currentLevel = this.save.level;
    if (currentLevel >= LEVEL_XP.length - 1) return;
    if (this.save.xp >= LEVEL_XP[currentLevel]) {
      this.save.level++;
      this.notify(`LEVEL UP! You are now level ${this.save.level}!`);
    }
  },

  // --- Skills & Shop ---
  upgradeSkill(skillId) {
    const current = this.save.skills[skillId] || 0;
    const skill = SKILLS[skillId];
    if (!skill || current >= skill.maxLevel) return false;
    const cost = skillUpgradeCost(current);
    if (this.save.currency < cost) return false;
    this.save.currency -= cost;
    this.save.skills[skillId]++;
    this.persistSave();
    return true;
  },

  buyEquipment(eqId) {
    const eq = EQUIPMENT[eqId];
    if (!eq || this.save.equipment[eqId]) return false;
    if (this.save.currency < eq.cost) return false;
    this.save.currency -= eq.cost;
    this.save.equipment[eqId] = true;
    this.persistSave();
    return true;
  },

  healPlayer() {
    if (this.save.health >= this.save.maxHealth) return false;
    const cost = 50;
    if (this.save.currency < cost) return false;
    this.save.currency -= cost;
    this.save.health = this.save.maxHealth;
    this.persistSave();
    return true;
  },

  // --- Click Handling ---
  handleClick(mx, my) {
    // Delegate to UI click handler
    UI.handleClick(mx, my, this);
  },

  // --- Notifications ---
  notify(text, isError = false) {
    this.notifications.push({ text, time: Date.now(), error: isError });
  },

  // --- State transitions ---
  goToMenu() { this.state = 'menu'; },
  goToLocationSelect() { this.state = 'location_select'; },
  goToSkills() { this.state = 'skills'; },
  goToShop() { this.state = 'shop'; },
  goToBestiary() { this.state = 'bestiary'; },
  goToTraining() { this.startTraining(); },
};

// Start on load
window.addEventListener('load', () => Game.init());
