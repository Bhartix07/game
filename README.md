# ⭐ Star Collector – HTML5 Canvas Game

🎮 **Live Demo:**  
🔗 https://bhartix07.github.io/game/

A fast-paced, minimal HTML5 Canvas arcade game where you guide a glowing cube to collect stars before the timer runs out. Move skillfully, plan your path, and beat your best score!

---

## 📸 Gameplay Preview

> *(Replace with your actual image link once uploaded)*  
<img src="assets/screenshot-2025-12-08 014021.png" alt="Star Collector Gameplay" width="700"/>

---

## 🎮 How to Play

| Action | Control |
|--------|---------|
| Move Up | ↑ or **W** |
| Move Down | ↓ or **S** |
| Move Left | ← or **A** |
| Move Right | → or **D** |
| Restart | **R** or click the canvas |

### Objective
- Collect **all stars** before the time is up ⏱️  
- Each star = **+10 points**
- Score bonus for remaining time  
  `Bonus = Remaining Seconds × 10`

### Game States
- 💤 **Idle** — Waiting to start  
- 🚀 **Playing** — Timer active, stars collectible  
- 🏆 **Mission Complete** — Victory! Score finalized  
- ⛔ **Time Up** — You ran out of time  

---

## 🔥 Features

✔ Smooth **60 FPS** gameplay  
✔ Physics-based movement (acceleration + friction)  
✔ Session-based **High Score** tracking  
✔ Neon-style grid and glow effects  
✔ Pure **HTML5 + CSS + JavaScript** — no libraries!  
✔ Fully offline — just open the page and play  

---

## 📂 Project Structure

```text
.
├── index.html   # Main game interface and canvas
├── style.css    # Modern UI styling, glow effects
└── script.js    # Game logic, rendering, scoring, controls
