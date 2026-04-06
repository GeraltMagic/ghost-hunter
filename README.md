# Ghost Hunter

A browser-based paranormal investigation game where you use modern ghost hunting equipment to detect, identify, and capture ghosts across increasingly dangerous locations.

**[Play Now](https://geraltmagic.github.io/ghost-hunter/)**

![Ghost Hunter](https://img.shields.io/badge/Platform-Web%20Browser-32c864?style=flat-square) ![JavaScript](https://img.shields.io/badge/Stack-Vanilla%20JS%20%2B%20Canvas-ffaa00?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## About

Ghost Hunter is a single-player investigation game inspired by modern paranormal TV shows and games like Phasmophobia. You play as a new recruit in the Paranormal Investigation Unit, armed with professional ghost hunting equipment. Your job: enter haunted locations, gather evidence, identify the ghost type, and capture it before time runs out — or before it captures you.

The game features a pixel-art aesthetic, a progression system with unlockable skills and equipment, and an interactive training mode that teaches you the ropes before you face real danger.

## How to Play

### Quick Start

1. Open the [game link](https://geraltmagic.github.io/ghost-hunter/) in any modern browser
2. Click **TRAINING** on the main menu (recommended for first-time players)
3. Complete the guided tutorial to learn movement, equipment, and ghost identification
4. Return to the menu and click **NEW HUNT** to start a real investigation

### Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` or Arrow Keys | Move |
| `1` `2` `3` `4` | Select equipment slot |
| `E` | Use active equipment |
| `J` | Open/close Journal |
| `Esc` | Close Journal |

### Gameplay Loop

1. **Select a Location** — Choose from available locations based on your level
2. **Investigate** — Move through rooms and use equipment to scan for paranormal activity
3. **Gather Evidence** — Each piece of equipment detects a specific evidence type. Get close to the ghost and scan repeatedly
4. **Identify the Ghost** — Open your Journal (`J`) to review collected evidence. Each ghost has a unique evidence combination
5. **Capture** — Click the matching ghost name in the Journal to attempt capture
6. **Earn Rewards** — Successful captures earn XP and currency for upgrades

### Tips

- **Get close.** Equipment has limited range — you need to be near the ghost to detect evidence
- **Use multiple tools.** Switch between equipment types to gather different evidence
- **Watch your sanity.** It drains faster near ghosts. Low sanity triggers ghost Hunts
- **During a Hunt, run!** The ghost will chase you aggressively. Keep moving until it ends
- **Check the evidence matrix.** Each ghost has exactly 2-3 evidence types. Match them precisely

## Game Content

### Ghost Types

| Ghost | Tier | Danger | Evidence | Behavior |
|-------|------|--------|----------|----------|
| **Shade** | 1 | Low | EMF, Thermal | Timid, avoids the player, dims lights |
| **Whisper** | 1 | Low | Spirit Box, Orbs | Vocal, communicates through electronics |
| **Poltergeist** | 2 | Medium | EMF, Spirit Box, UV | Violent, throws objects, disrupts equipment |
| **Wraith** | 2 | Medium | Thermal, UV, Orbs | Teleports, passes through walls, leaves traces |
| **Banshee** | 3 | High | EMF, Thermal, Spirit Box | Stalks relentlessly, screams, very aggressive |

### Locations

| Location | Tier | Required Level | Ghosts | Payout |
|----------|------|---------------|--------|--------|
| **Abandoned House** | 1 | 1 | 1 ghost (Shade, Whisper) | $100 |
| **Old Hospital** | 2 | 3 | 2 ghosts (Shade, Whisper, Poltergeist, Wraith) | $250 |
| **Ravenhollow Cemetery** | 3 | 5 | 2 ghosts (Poltergeist, Wraith, Banshee) | $500 |

### Equipment

| Tool | Detects | Range | Starting |
|------|---------|-------|----------|
| **EMF Reader** | EMF Reading | 120 | Yes |
| **Spirit Box** | Spirit Box | 100 | Yes |
| **Thermal Camera** | Thermal Anomaly | 150 | $200 |
| **UV Light** | UV Traces | 80 | $350 |

### Skills

| Skill | Effect | Max Level |
|-------|--------|-----------|
| **Detection** | Increases equipment range and sensitivity | 10 |
| **Resilience** | Reduces sanity drain during investigations | 10 |
| **Identification** | Evidence appears faster and more clearly | 10 |
| **Capture** | Increases capture success rate | 10 |

## Progression

- **XP** — Earned from successful captures and partial credit for evidence gathering
- **Levels** — Unlock harder locations as you level up (Level 3 for Hospital, Level 5 for Cemetery)
- **Currency** — Spend on skill upgrades and new equipment
- **Equipment Proficiency** — Each tool improves with use, increasing range and detection accuracy
- **Bestiary** — Track which ghosts you've encountered and captured

Your progress saves automatically to your browser's local storage.

## Project Structure

```
ghost-hunter/
  index.html          # Entry point
  css/
    style.css         # UI styling, menus, overlays
  js/
    data.js           # Game data: ghosts, locations, equipment, skills, training steps
    engine.js         # Core game loop, state machine, mechanics
    renderer.js       # Canvas rendering for all screens
    ui.js             # Click handling and UI interaction
```

## Running Locally

No build tools or dependencies required. Just open `index.html` in a browser:

```bash
git clone https://github.com/GeraltMagic/ghost-hunter.git
cd ghost-hunter
open index.html        # macOS
# or
xdg-open index.html    # Linux
# or
start index.html       # Windows
```

Or serve it locally:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Tech Stack

- **Vanilla JavaScript** — No frameworks or dependencies
- **HTML5 Canvas** — All rendering done via 2D canvas API
- **localStorage** — Persistent save system
- **Zero build step** — Open and play, nothing to install

## Contributing

Contributions are welcome! Some areas that could use work:

- Additional ghost types and locations
- Sound effects and ambient audio
- Mobile touch controls
- More complex ghost AI behaviors
- Visual effects and animations
- Difficulty settings

## License

MIT
