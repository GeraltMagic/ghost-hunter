// ============================================================
// Ghost Hunter — Game Data
// ============================================================

const EVIDENCE_TYPES = {
  EMF: { name: 'EMF Reading', icon: '📡', color: '#ffaa00' },
  SPIRIT_BOX: { name: 'Spirit Box', icon: '📻', color: '#aa44ff' },
  THERMAL: { name: 'Thermal Anomaly', icon: '🌡️', color: '#4488ff' },
  UV: { name: 'UV Traces', icon: '🔦', color: '#88ff44' },
  ORBS: { name: 'Ghost Orbs', icon: '🔮', color: '#ffffff' },
};

const EQUIPMENT = {
  emf_reader: {
    id: 'emf_reader',
    name: 'EMF Reader',
    description: 'Detects electromagnetic fluctuations caused by ghost activity',
    evidence: 'EMF',
    key: '1',
    cost: 0, // starter
    range: 120,
    cooldown: 2000,
    color: '#ffaa00',
    proficiencyGain: 0.02,
  },
  spirit_box: {
    id: 'spirit_box',
    name: 'Spirit Box',
    description: 'Scans radio frequencies to pick up ghost voices',
    evidence: 'SPIRIT_BOX',
    key: '2',
    cost: 0, // starter
    range: 100,
    cooldown: 3000,
    color: '#aa44ff',
    proficiencyGain: 0.015,
  },
  thermal_cam: {
    id: 'thermal_cam',
    name: 'Thermal Camera',
    description: 'Detects cold spots and thermal anomalies',
    evidence: 'THERMAL',
    key: '3',
    cost: 200,
    range: 150,
    cooldown: 2500,
    color: '#4488ff',
    proficiencyGain: 0.015,
  },
  uv_light: {
    id: 'uv_light',
    name: 'UV Light',
    description: 'Reveals ectoplasmic residue and ghost fingerprints',
    evidence: 'UV',
    key: '4',
    cost: 350,
    range: 80,
    cooldown: 1500,
    color: '#88ff44',
    proficiencyGain: 0.02,
  },
};

// Ghost definitions — each has unique evidence combinations
const GHOSTS = {
  shade: {
    id: 'shade',
    name: 'Shade',
    tier: 1,
    danger: 'Low',
    description: 'A timid ghost that hides from the living. Rarely interacts directly.',
    behavior: 'Avoids the player, dims lights when nearby',
    evidence: ['EMF', 'THERMAL'],
    baseXP: 50,
    aggressionChance: 0.05,
    speed: 0.6,
    huntThreshold: 0.2, // sanity threshold to trigger hunt
    color: '#667788',
    spriteFrames: 4,
  },
  whisper: {
    id: 'whisper',
    name: 'Whisper',
    tier: 1,
    danger: 'Low',
    description: 'A vocal spirit that communicates through electronic devices.',
    behavior: 'Responds to spirit box, causes static on equipment',
    evidence: ['SPIRIT_BOX', 'ORBS'],
    baseXP: 60,
    aggressionChance: 0.08,
    speed: 0.5,
    huntThreshold: 0.25,
    color: '#9988cc',
    spriteFrames: 4,
  },
  poltergeist: {
    id: 'poltergeist',
    name: 'Poltergeist',
    tier: 2,
    danger: 'Medium',
    description: 'A violent ghost that manipulates physical objects.',
    behavior: 'Throws objects, disrupts equipment, slams doors',
    evidence: ['EMF', 'SPIRIT_BOX', 'UV'],
    baseXP: 120,
    aggressionChance: 0.25,
    speed: 0.9,
    huntThreshold: 0.4,
    color: '#cc4444',
    spriteFrames: 6,
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    tier: 2,
    danger: 'Medium',
    description: 'A floating ghost that can pass through walls. Leaves no footprints.',
    behavior: 'Teleports randomly, leaves thermal traces, can fly',
    evidence: ['THERMAL', 'UV', 'ORBS'],
    baseXP: 140,
    aggressionChance: 0.2,
    speed: 1.1,
    huntThreshold: 0.35,
    color: '#4466aa',
    spriteFrames: 6,
  },
  banshee: {
    id: 'banshee',
    name: 'Banshee',
    tier: 3,
    danger: 'High',
    description: 'A screaming spirit that targets a single victim relentlessly.',
    behavior: 'Stalks the player, emits screams, very aggressive during hunts',
    evidence: ['EMF', 'THERMAL', 'SPIRIT_BOX'],
    baseXP: 250,
    aggressionChance: 0.4,
    speed: 1.4,
    huntThreshold: 0.5,
    color: '#ff3366',
    spriteFrames: 8,
  },
};

// Location definitions
const LOCATIONS = {
  house: {
    id: 'house',
    name: 'Abandoned House',
    description: 'A decrepit Victorian home on the edge of town. Strange noises reported at night.',
    tier: 1,
    requiredLevel: 1,
    width: 800,
    height: 500,
    ghostPool: ['shade', 'whisper'],
    maxGhosts: 1,
    rooms: [
      { name: 'Hallway', x: 300, y: 200, w: 200, h: 100, color: '#1a1510' },
      { name: 'Living Room', x: 50, y: 50, w: 240, h: 180, color: '#1c1812' },
      { name: 'Kitchen', x: 510, y: 50, w: 240, h: 180, color: '#161410' },
      { name: 'Bedroom', x: 50, y: 310, w: 240, h: 150, color: '#18141a' },
      { name: 'Bathroom', x: 510, y: 310, w: 240, h: 150, color: '#141618' },
    ],
    wallColor: '#2a2218',
    floorColor: '#12100c',
    ambientLight: 0.35,
    payout: 100,
  },
  hospital: {
    id: 'hospital',
    name: 'Old Hospital',
    description: 'A condemned hospital with a dark history. Multiple sightings reported across wings.',
    tier: 2,
    requiredLevel: 3,
    width: 900,
    height: 550,
    ghostPool: ['shade', 'whisper', 'poltergeist', 'wraith'],
    maxGhosts: 2,
    rooms: [
      { name: 'Reception', x: 350, y: 220, w: 200, h: 110, color: '#141816' },
      { name: 'Ward A', x: 50, y: 50, w: 280, h: 160, color: '#161a18' },
      { name: 'Ward B', x: 570, y: 50, w: 280, h: 160, color: '#161a18' },
      { name: 'Operating Room', x: 50, y: 340, w: 280, h: 170, color: '#1a1416' },
      { name: 'Morgue', x: 570, y: 340, w: 280, h: 170, color: '#101418' },
      { name: 'Corridor', x: 340, y: 50, w: 220, h: 160, color: '#121210' },
    ],
    wallColor: '#222828',
    floorColor: '#0e100e',
    ambientLight: 0.25,
    payout: 250,
  },
  cemetery: {
    id: 'cemetery',
    name: 'Ravenhollow Cemetery',
    description: 'An ancient graveyard where the veil between worlds is thin. Only for experienced hunters.',
    tier: 3,
    requiredLevel: 5,
    width: 950,
    height: 600,
    ghostPool: ['poltergeist', 'wraith', 'banshee'],
    maxGhosts: 2,
    rooms: [
      { name: 'Gate Entrance', x: 375, y: 10, w: 200, h: 120, color: '#0e120e' },
      { name: 'West Graves', x: 50, y: 50, w: 310, h: 240, color: '#0c100c' },
      { name: 'East Graves', x: 590, y: 50, w: 310, h: 240, color: '#0c100c' },
      { name: 'Crypt', x: 350, y: 350, w: 250, h: 200, color: '#101014' },
      { name: 'Mausoleum', x: 50, y: 350, w: 280, h: 200, color: '#0e0e14' },
      { name: 'Chapel Ruins', x: 630, y: 350, w: 270, h: 200, color: '#12100e' },
    ],
    wallColor: '#1a201a',
    floorColor: '#080a08',
    ambientLight: 0.15,
    payout: 500,
  },
};

// Progression tables
const LEVEL_XP = [0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200, 7000];

const SKILLS = {
  detection: {
    name: 'Detection',
    description: 'Increases equipment range and sensitivity',
    maxLevel: 10,
    effect: (level) => ({ rangeBonus: level * 0.08, sensitivityBonus: level * 0.05 }),
  },
  resilience: {
    name: 'Resilience',
    description: 'Reduces sanity drain during hunts',
    maxLevel: 10,
    effect: (level) => ({ sanityDrainReduction: level * 0.07 }),
  },
  identification: {
    name: 'Identification',
    description: 'Evidence appears faster and more clearly',
    maxLevel: 10,
    effect: (level) => ({ evidenceSpeedBonus: level * 0.1 }),
  },
  capture: {
    name: 'Capture',
    description: 'Increases capture success rate',
    maxLevel: 10,
    effect: (level) => ({ captureBonus: level * 0.06 }),
  },
};

// Cost to upgrade a skill to the next level
function skillUpgradeCost(currentLevel) {
  return (currentLevel + 1) * 75;
}

// Training system
const TRAINING_LOCATION = {
  id: 'training',
  name: 'Training Facility',
  description: 'A controlled environment for new recruits.',
  tier: 0,
  requiredLevel: 0,
  width: 600,
  height: 400,
  ghostPool: ['shade'],
  maxGhosts: 1,
  rooms: [
    { name: 'Training Room A', x: 50, y: 50, w: 220, h: 300, color: '#141820' },
    { name: 'Training Room B', x: 330, y: 50, w: 220, h: 300, color: '#141820' },
  ],
  wallColor: '#283040',
  floorColor: '#0c1018',
  ambientLight: 0.5,
  payout: 0,
};

const TRAINING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome, Recruit',
    text: 'Welcome to the Paranormal Investigation Unit training program. This simulation will teach you everything you need to survive in the field.',
    action: 'click_continue',
    highlight: null,
  },
  {
    id: 'movement',
    title: 'Movement',
    text: 'Use WASD or Arrow Keys to move around. Explore your surroundings — walk to Training Room B on the right.',
    action: 'move_to_room_b',
    highlight: 'player',
    targetRoom: 1,
  },
  {
    id: 'equipment_intro',
    title: 'Your Equipment',
    text: 'You carry detection equipment in numbered slots at the bottom-right. Press [1] to select your EMF Reader.',
    action: 'select_emf',
    highlight: 'equipment',
  },
  {
    id: 'use_equipment',
    title: 'Using Equipment',
    text: 'A training ghost has been released nearby. Press [E] to scan with your EMF Reader. Get close and keep trying — readings can be inconclusive.',
    action: 'find_evidence',
    highlight: 'use_key',
  },
  {
    id: 'switch_equipment',
    title: 'Switching Equipment',
    text: 'Good work! Now press [2] to switch to your Spirit Box, then press [E] to scan again.',
    action: 'use_spirit_box',
    highlight: 'equipment',
  },
  {
    id: 'journal_intro',
    title: 'The Journal',
    text: 'Press [J] to open your Journal. It shows the evidence you\'ve collected and lets you identify the ghost.',
    action: 'open_journal',
    highlight: 'journal_key',
  },
  {
    id: 'identify_ghost',
    title: 'Ghost Identification',
    text: 'Review your collected evidence. Each ghost type leaves a unique evidence combination. Click the ghost name that matches your evidence to attempt capture.',
    action: 'attempt_capture',
    highlight: 'journal',
  },
  {
    id: 'sanity_explain',
    title: 'Sanity & Hunts',
    text: 'In real investigations, your sanity drains over time — faster near ghosts. When sanity drops low enough, ghosts can initiate a Hunt and chase you. Keep moving and gather evidence quickly!',
    action: 'click_continue',
    highlight: null,
  },
  {
    id: 'skills_explain',
    title: 'Skills & Progression',
    text: 'Successful hunts earn XP and currency. Spend currency to upgrade skills (Detection, Resilience, Identification, Capture) and buy new equipment from the Shop.',
    action: 'click_continue',
    highlight: null,
  },
  {
    id: 'complete',
    title: 'Training Complete!',
    text: 'You\'re ready for the field, recruit. Start with the Abandoned House — it has the lowest threat level. Good luck out there.',
    action: 'click_finish',
    highlight: null,
  },
];

// Default save state
function getDefaultSave() {
  return {
    level: 1,
    xp: 0,
    currency: 150,
    health: 100,
    maxHealth: 100,
    sanity: 100,
    huntsCompleted: 0,
    ghostsCaptured: 0,
    skills: {
      detection: 0,
      resilience: 0,
      identification: 0,
      capture: 0,
    },
    equipment: {
      emf_reader: true,
      spirit_box: true,
      thermal_cam: false,
      uv_light: false,
    },
    equipmentProficiency: {
      emf_reader: 0,
      spirit_box: 0,
      thermal_cam: 0,
      uv_light: 0,
    },
    trainingComplete: false,
    bestiary: {}, // ghostId -> { seen: bool, captured: int }
  };
}
