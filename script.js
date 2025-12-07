'use strict';

/**
 * Game Configuration
 */
const CONFIG = {
  FPS: 60,
  FRICTION: 0.92,
  STAR_COUNT: 5,
  PLAYER_ACCEL: 900,
  PLAYER_MAX_SPEED: 320,
  TIME_LIMIT: 15, // 15 Seconds to collect all stars!
  COLORS: {
    PLAYER: '#4cc9f0',
    STAR_CORE: '#FFD700',
    STAR_GLOW: 'rgba(255, 216, 0, 0.4)',
    HUD_TEXT: '#ffffff',
    ACCENT: '#4cc9f0'
  }
};

/**
 * Input Handler
 */
class InputHandler {
  constructor() {
    this.keys = { up: false, down: false, left: false, right: false };
    
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup',  (e) => this.handleKey(e, false));
  }

  handleKey(e, isPressed) {
    const code = e.code;

    if (code === 'ArrowUp'    || code === 'KeyW') this.keys.up    = isPressed;
    if (code === 'ArrowDown'  || code === 'KeyS') this.keys.down  = isPressed;
    if (code === 'ArrowLeft'  || code === 'KeyA') this.keys.left  = isPressed;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = isPressed;
    
    if (code === 'KeyR' && isPressed) {
      document.dispatchEvent(new Event('game-restart'));
    }
  }
}

/**
 * Main Game Engine
 */
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error('Canvas element not found');

    // Ensure focusable
    this.canvas.setAttribute('tabindex', '0');
    
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.input = new InputHandler();
    this.uiScore = document.getElementById('ui-instructions');
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    this.highScore = 0; 

    this.dt = 1 / CONFIG.FPS;
    this.accumulator = 0;
    this.lastTime = 0;

    this.gameState = 'idle'; // idle | playing | won | gameover
    this.score = 0;
    this.timeLeft = CONFIG.TIME_LIMIT;
    this.player = this.createPlayer();
    this.stars = [];

    this.init();
  }

  createPlayer() {
    return { x: 100, y: 100, size: 28, vx: 0, vy: 0 };
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('game-restart', () => {
      if (this.gameState === 'won' || this.gameState === 'gameover') {
        this.reset();
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.gameState === 'idle') {
        this.reset();
      } else if (this.gameState === 'won' || this.gameState === 'gameover') {
        this.reset();
      }
    });

    this.updateUI(); // show idle instructions initially

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    // If you want responsive canvas, handle scaling here.
    // Currently using fixed internal resolution (800x600).
  }

  reset() {
    this.player = this.createPlayer();
    this.stars = this.spawnStars();
    this.score = 0;
    this.timeLeft = CONFIG.TIME_LIMIT;
    this.gameState = 'playing';
    
    this.canvas.focus(); 
    this.updateUI();
  }

  spawnStars() {
    const stars = [];
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      let x, y, dist;
      do {
        x = Math.random() * (this.width - 80) + 40;
        y = Math.random() * (this.height - 80) + 40;
        dist = Math.hypot(x - this.player.x, y - this.player.y);
      } while (dist < 100);
      
      stars.push({ x, y, r: Math.random() * 5 + 7, collected: false });
    }
    return stars;
  }

  loop(now) {
    const frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    this.accumulator += Math.min(frameTime, 0.25);

    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.gameState !== 'playing') return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endGame('gameover');
      return;
    }

    this.updatePlayerPhysics(dt);
    this.checkBoundaries();
    
    let hit = false;
    for (const star of this.stars) {
      if (star.collected) continue;
      const dist = Math.hypot(star.x - this.player.x, star.y - this.player.y);
      if (dist < star.r + this.player.size * 0.5) {
        star.collected = true;
        this.score += 10;
        hit = true;
      }
    }

    const remaining = this.stars.filter(s => !s.collected).length;
    if (remaining === 0) {
      this.score += Math.ceil(this.timeLeft) * 10;
      this.endGame('won');
    }

    if (hit) this.updateUI();
  }

  updatePlayerPhysics(dt) {
    const { keys } = this.input;
    const p = this.player;

    if (keys.left)  p.vx -= CONFIG.PLAYER_ACCEL * dt;
    if (keys.right) p.vx += CONFIG.PLAYER_ACCEL * dt;
    if (keys.up)    p.vy -= CONFIG.PLAYER_ACCEL * dt;
    if (keys.down)  p.vy += CONFIG.PLAYER_ACCEL * dt;

    p.vx *= CONFIG.FRICTION;
    p.vy *= CONFIG.FRICTION;

    const speed = Math.hypot(p.vx, p.vy);
    if (speed > CONFIG.PLAYER_MAX_SPEED) {
      const scale = CONFIG.PLAYER_MAX_SPEED / speed;
      p.vx *= scale;
      p.vy *= scale;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  checkBoundaries() {
    const p = this.player;
    const half = p.size / 2;

    if (p.x < half) {
      p.x = half;
      p.vx = 0;
    }
    if (p.x > this.width - half) {
      p.x = this.width - half;
      p.vx = 0;
    }
    if (p.y < half) {
      p.y = half;
      p.vy = 0;
    }
    if (p.y > this.height - half) {
      p.y = this.height - half;
      p.vy = 0;
    }
  }

  endGame(result) {
    this.gameState = result;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.updateUI();
  }

  updateUI() {
    if (!this.uiScore) return;

    if (this.gameState === 'idle') {
      this.uiScore.textContent =
        'Click the game area to start. Use Arrow Keys or WASD to move.';
    } else if (this.gameState === 'playing') {
      this.uiScore.textContent =
        `Score: ${this.score} | High Score: ${this.highScore}`;
    } else if (this.gameState === 'won') {
      this.uiScore.textContent =
        `You Won! Final Score: ${this.score} | High Score: ${this.highScore} (Press R or Click to play again)`;
    } else if (this.gameState === 'gameover') {
      this.uiScore.textContent =
        `Time Up! Final Score: ${this.score} | High Score: ${this.highScore} (Press R or Click to retry)`;
    }
  }

  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawGrid(ctx);

    if (this.gameState !== 'idle') {
      for (const star of this.stars) {
        if (!star.collected) this.drawStar(ctx, star);
      }
      this.drawPlayer(ctx);
      this.drawHUD(ctx);
    }

    if (this.gameState === 'idle') {
      this.drawOverlay(ctx, 'Star Collector', 'Click to Start', '#4cc9f0');
    } else if (this.gameState === 'won') {
      this.drawOverlay(ctx, 'Mission Complete!', `Final Score: ${this.score}`, '#2ecc71');
    } else if (this.gameState === 'gameover') {
      this.drawOverlay(ctx, 'Time Up!', 'Try Again', '#e74c3c');
    }
  }

  drawHUD(ctx) {
    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 35);
    
    ctx.textAlign = 'right';
    if (this.timeLeft < 5) {
      ctx.fillStyle = '#e74c3c';
    } else {
      ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    }
    ctx.fillText(`Time: ${this.timeLeft.toFixed(1)}`, this.width - 20, 35);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Best: ${this.highScore}`, this.width / 2, 35);
  }

  drawOverlay(ctx, title, subtitle, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = color;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, this.width / 2, this.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText(subtitle, this.width / 2, this.height / 2 + 30);
    
    if (this.gameState !== 'idle') {
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Click or Press R to Restart', this.width / 2, this.height / 2 + 70);
    }
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 6);
    } else {
      // Fallback if roundRect not supported
      ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.fill();
  }

  drawStar(ctx, star) {
    // Glow
    const glow = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.r * 2.5
    );
    glow.addColorStop(0, CONFIG.COLORS.STAR_GLOW);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = CONFIG.COLORS.STAR_CORE;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= this.width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }

    ctx.stroke();
  }
}

// Start
window.onload = () => new Game('gameCanvas');
