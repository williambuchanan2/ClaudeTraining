'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATE = { MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAME_OVER: 'GAME_OVER', VICTORY: 'VICTORY' };
const ENEMY_TYPE = { GRUNT: 'GRUNT', CHARGER: 'CHARGER', SHOOTER: 'SHOOTER' };

const SCORES = { GRUNT: 100, CHARGER: 200, SHOOTER: 300, WAVE_BONUS: 500 };

const LEVELS = [
  { // Level 1
    waves: [
      [{ type: ENEMY_TYPE.GRUNT, count: 4, speed: 60 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 6, speed: 65 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 8, speed: 70 }],
    ]
  },
  { // Level 2
    waves: [
      [{ type: ENEMY_TYPE.GRUNT, count: 5, speed: 70 }, { type: ENEMY_TYPE.CHARGER, count: 2, speed: 90 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 6, speed: 75 }, { type: ENEMY_TYPE.CHARGER, count: 3, speed: 95 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 4, speed: 80 }, { type: ENEMY_TYPE.CHARGER, count: 4, speed: 100 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 8, speed: 80 }, { type: ENEMY_TYPE.CHARGER, count: 3, speed: 105 }],
    ]
  },
  { // Level 3
    waves: [
      [{ type: ENEMY_TYPE.GRUNT, count: 5, speed: 80 }, { type: ENEMY_TYPE.SHOOTER, count: 2, speed: 55 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 6, speed: 85 }, { type: ENEMY_TYPE.CHARGER, count: 3, speed: 110 }, { type: ENEMY_TYPE.SHOOTER, count: 2, speed: 55 }],
      [{ type: ENEMY_TYPE.CHARGER, count: 5, speed: 115 }, { type: ENEMY_TYPE.SHOOTER, count: 3, speed: 60 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 8, speed: 90 }, { type: ENEMY_TYPE.CHARGER, count: 4, speed: 120 }, { type: ENEMY_TYPE.SHOOTER, count: 3, speed: 60 }],
    ]
  },
  { // Level 4
    waves: [
      [{ type: ENEMY_TYPE.GRUNT, count: 10, speed: 95 }, { type: ENEMY_TYPE.CHARGER, count: 4, speed: 130 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 8, speed: 100 }, { type: ENEMY_TYPE.SHOOTER, count: 5, speed: 65 }],
      [{ type: ENEMY_TYPE.CHARGER, count: 8, speed: 135 }, { type: ENEMY_TYPE.SHOOTER, count: 4, speed: 65 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 12, speed: 105 }, { type: ENEMY_TYPE.CHARGER, count: 5, speed: 140 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 6, speed: 110 }, { type: ENEMY_TYPE.CHARGER, count: 6, speed: 145 }, { type: ENEMY_TYPE.SHOOTER, count: 5, speed: 70 }],
    ]
  },
  { // Level 5
    waves: [
      [{ type: ENEMY_TYPE.GRUNT, count: 10, speed: 115 }, { type: ENEMY_TYPE.CHARGER, count: 6, speed: 150 }],
      [{ type: ENEMY_TYPE.SHOOTER, count: 8, speed: 75 }, { type: ENEMY_TYPE.CHARGER, count: 5, speed: 155 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 15, speed: 120 }, { type: ENEMY_TYPE.SHOOTER, count: 6, speed: 80 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 10, speed: 125 }, { type: ENEMY_TYPE.CHARGER, count: 8, speed: 160 }, { type: ENEMY_TYPE.SHOOTER, count: 5, speed: 80 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 12, speed: 130 }, { type: ENEMY_TYPE.CHARGER, count: 6, speed: 165 }, { type: ENEMY_TYPE.SHOOTER, count: 7, speed: 85 }],
      [{ type: ENEMY_TYPE.GRUNT, count: 20, speed: 135, boss: false }, { type: ENEMY_TYPE.GRUNT, count: 1, speed: 80, boss: true }],
    ]
  },
];

// ─── InputHandler ─────────────────────────────────────────────────────────────

class InputHandler {
  constructor(canvas) {
    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false, leftJustPressed: false };
    this._leftWasDown = false;

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this.keys[e.key] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
    });
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      this.mouse.x = (e.clientX - r.left) * scaleX;
      this.mouse.y = (e.clientY - r.top) * scaleY;
    });
    canvas.addEventListener('mousedown', e => { if (e.button === 0) this.mouse.left = true; });
    canvas.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.left = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  update() {
    this.mouse.leftJustPressed = this.mouse.left && !this._leftWasDown;
    this._leftWasDown = this.mouse.left;
  }

  isDown(code) { return !!this.keys[code]; }
  justPressed(code) { return !!this.keys[code]; }
}

// ─── Particle ─────────────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, radius, life) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.life = life;      // ms
    this.maxLife = life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt / 1000;
    this.y += this.vy * dt / 1000;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Bullet ───────────────────────────────────────────────────────────────────

class Bullet {
  constructor(x, y, angle, speed, fromPlayer, color = '#FFE44D') {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.fromPlayer = fromPlayer;
    this.color = color;
    this.radius = fromPlayer ? 4 : 5;
    this.dead = false;
    this.trail = [];
  }

  update(dt, canvasW, canvasH) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += this.vx * dt / 1000;
    this.y += this.vy * dt / 1000;

    if (this.x < -20 || this.x > canvasW + 20 || this.y < -20 || this.y > canvasH + 20) {
      this.dead = true;
    }
  }

  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = 18;
    this.speed = 200;
    this.angle = 0;          // gun direction
    this.health = 100;
    this.maxHealth = 100;
    this.dead = false;

    // Shooting
    this.fireRate = 150;       // ms between shots
    this.fireCooldown = 0;
    this.bulletSpeed = 550;
    this.clipSize = 30;
    this.ammo = 30;
    this.reserve = 180;
    this.reloading = false;
    this.reloadTime = 1500;
    this.reloadTimer = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;

    // Animation
    this.walkTimer = 0;
    this.hitFlash = 0;
    this.knockbackX = 0;
    this.knockbackY = 0;

    // Muzzle flash
    this.muzzleFlash = 0;
  }

  update(dt, input, bullets, particles) {
    // Movement
    let dx = 0, dy = 0;
    if (input.isDown('ArrowUp') || input.isDown('KeyW') || input.isDown('w')) dy -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS') || input.isDown('s')) dy += 1;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA') || input.isDown('a')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD') || input.isDown('d')) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }

    this.x += (dx * this.speed + this.knockbackX) * dt / 1000;
    this.y += (dy * this.speed + this.knockbackY) * dt / 1000;
    this.knockbackX *= 0.85;
    this.knockbackY *= 0.85;

    // Walk timer
    if (len > 0) this.walkTimer += dt;

    // Aim
    this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

    // Timers
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Reload
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const need = this.clipSize - this.ammo;
        const take = Math.min(need, this.reserve);
        this.ammo += take;
        this.reserve -= take;
        this.reloading = false;
      }
    }

    // Auto-reload when empty
    if (this.ammo === 0 && !this.reloading && this.reserve > 0) {
      this.reloading = true;
      this.reloadTimer = this.reloadTime;
    }

    // Manual reload
    if ((input.isDown('KeyR') || input.isDown('r')) && !this.reloading && this.ammo < this.clipSize && this.reserve > 0) {
      this.reloading = true;
      this.reloadTimer = this.reloadTime;
    }

    // Shoot
    if (input.mouse.left && this.fireCooldown <= 0 && !this.reloading && this.ammo > 0) {
      this.shoot(bullets, particles);
    }
  }

  shoot(bullets, particles) {
    const gunLength = 26;
    const bx = this.x + Math.cos(this.angle) * gunLength;
    const by = this.y + Math.sin(this.angle) * gunLength;

    bullets.push(new Bullet(bx, by, this.angle, this.bulletSpeed, true));
    this.fireCooldown = this.fireRate;
    this.muzzleFlash = 80;
    this.ammo--;
    this.shotsFired++;

    // Muzzle particles
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const speed = 80 + Math.random() * 120;
      particles.push(new Particle(bx, by,
        Math.cos(this.angle + spread) * speed,
        Math.sin(this.angle + spread) * speed,
        '#FFE44D', 3, 120));
    }
  }

  takeDamage(amount, fromX, fromY) {
    if (this.hitFlash > 0) return; // brief invincibility
    this.health -= amount;
    this.hitFlash = 120;
    // Knockback away from source
    const a = Math.atan2(this.y - fromY, this.x - fromX);
    this.knockbackX += Math.cos(a) * 180;
    this.knockbackY += Math.sin(a) * 180;
    if (this.health <= 0) { this.health = 0; this.dead = true; }
  }

  clampToBounds(w, h) {
    this.x = Math.max(this.radius, Math.min(w - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(h - this.radius, this.y));
  }

  draw(ctx) {
    const t = this.walkTimer;
    const bob = Math.sin(t / 80) * 3;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x + 3, this.y + 6, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Legs
    const legOffset = Math.sin(t / 80) * 7;
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x - 7 + Math.cos(this.angle + Math.PI / 2) * legOffset - 4,
                 this.y + Math.sin(this.angle + Math.PI / 2) * legOffset - 4, 8, 10);
    ctx.fillRect(this.x - 7 - Math.cos(this.angle + Math.PI / 2) * legOffset - 4,
                 this.y - Math.sin(this.angle + Math.PI / 2) * legOffset - 4, 8, 10);

    // Body
    const flash = this.hitFlash > 0;
    ctx.fillStyle = flash ? '#fff' : '#3a3a4a';
    ctx.beginPath();
    ctx.arc(this.x, this.y + bob * 0.4, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = flash ? '#fff' : '#6a6a8a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gun
    ctx.save();
    ctx.translate(this.x, this.y + bob * 0.4);
    ctx.rotate(this.angle);
    ctx.fillStyle = flash ? '#fff' : '#222';
    ctx.fillRect(8, -4, 22, 8);
    // Gun highlight
    ctx.fillStyle = flash ? '#eee' : '#444';
    ctx.fillRect(8, -3, 22, 3);

    // Muzzle flash
    if (this.muzzleFlash > 0) {
      const alpha = this.muzzleFlash / 80;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFE44D';
      ctx.shadowColor = '#FFE44D';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(30, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Visor / eye dot
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(this.x + Math.cos(this.angle) * 10, this.y + Math.sin(this.angle) * 10 + bob * 0.4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

class Enemy {
  constructor(x, y, type, speed, isBoss = false) {
    this.x = x; this.y = y;
    this.type = type;
    this.baseSpeed = speed;
    this.speed = speed;
    this.isBoss = isBoss;
    this.dead = false;
    this.dying = false;
    this.dyingTimer = 0;

    this.hitFlash = 0;
    this.walkTimer = 0;
    this.angle = 0;

    // Type-specific
    switch (type) {
      case ENEMY_TYPE.GRUNT:
        this.health = isBoss ? 500 : 30;
        this.maxHealth = this.health;
        this.radius = isBoss ? 32 : 18;
        this.damage = isBoss ? 25 : 10;
        this.score = isBoss ? 1000 : SCORES.GRUNT;
        break;
      case ENEMY_TYPE.CHARGER:
        this.health = 20;
        this.maxHealth = 20;
        this.radius = 18;
        this.damage = 20;
        this.score = SCORES.CHARGER;
        this.chargeTimer = 0;
        this.chargeDelay = 2000 + Math.random() * 1500;
        this.charging = false;
        this.chargeSpeed = speed * 3.5;
        break;
      case ENEMY_TYPE.SHOOTER:
        this.health = 40;
        this.maxHealth = 40;
        this.radius = 18;
        this.damage = 12;
        this.score = SCORES.SHOOTER;
        this.shootTimer = 0;
        this.shootDelay = 1800 + Math.random() * 1200;
        this.preferredDist = 250;
        break;
    }
  }

  update(dt, player, bullets, particles) {
    if (this.dying) {
      this.dyingTimer -= dt;
      // Emit death particles continuously while dying
      if (Math.random() < 0.3) {
        const color = this.type === ENEMY_TYPE.GRUNT ? '#f44' :
                      this.type === ENEMY_TYPE.CHARGER ? '#f84' : '#a4f';
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * this.radius * 2,
          this.y + (Math.random() - 0.5) * this.radius * 2,
          (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200,
          color, 4, 400));
      }
      if (this.dyingTimer <= 0) this.dead = true;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.angle = Math.atan2(dy, dx);

    this.walkTimer += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    switch (this.type) {
      case ENEMY_TYPE.GRUNT:
        if (dist > this.radius + player.radius) {
          this.x += (dx / dist) * this.speed * dt / 1000;
          this.y += (dy / dist) * this.speed * dt / 1000;
        }
        break;

      case ENEMY_TYPE.CHARGER:
        this.chargeTimer += dt;
        if (!this.charging && this.chargeTimer > this.chargeDelay) {
          this.charging = true;
          this.chargeTimer = 0;
          this.chargeDelay = 2000 + Math.random() * 1500;
        }
        if (this.charging) {
          this.speed = this.chargeSpeed;
          this.x += (dx / dist) * this.speed * dt / 1000;
          this.y += (dy / dist) * this.speed * dt / 1000;
          if (dist < this.radius + player.radius + 10) this.charging = false;
          if (this.chargeTimer > 800) { this.charging = false; this.speed = this.baseSpeed; }
        } else {
          this.speed = this.baseSpeed;
          if (dist > this.radius + player.radius + 30) {
            this.x += (dx / dist) * this.speed * dt / 1000;
            this.y += (dy / dist) * this.speed * dt / 1000;
          }
        }
        break;

      case ENEMY_TYPE.SHOOTER:
        // Keep preferred distance
        if (dist > this.preferredDist + 40) {
          this.x += (dx / dist) * this.speed * dt / 1000;
          this.y += (dy / dist) * this.speed * dt / 1000;
        } else if (dist < this.preferredDist - 40) {
          this.x -= (dx / dist) * this.speed * dt / 1000;
          this.y -= (dy / dist) * this.speed * dt / 1000;
        } else {
          // Strafe
          this.x += (-dy / dist) * this.speed * 0.5 * dt / 1000;
          this.y += (dx / dist) * this.speed * 0.5 * dt / 1000;
        }

        this.shootTimer += dt;
        if (this.shootTimer > this.shootDelay) {
          this.shootTimer = 0;
          this.shootDelay = 1800 + Math.random() * 1200;
          // Fire at player with slight spread
          const spread = (Math.random() - 0.5) * 0.2;
          bullets.push(new Bullet(this.x, this.y, this.angle + spread, 280, false, '#c87fff'));
          // Muzzle particles
          for (let i = 0; i < 3; i++) {
            particles.push(new Particle(this.x + Math.cos(this.angle) * 22, this.y + Math.sin(this.angle) * 22,
              Math.cos(this.angle + (Math.random() - 0.5) * 0.8) * 80,
              Math.sin(this.angle + (Math.random() - 0.5) * 0.8) * 80,
              '#c87fff', 3, 150));
          }
        }
        break;
    }
  }

  takeDamage(amount, particles) {
    this.health -= amount;
    this.hitFlash = 100;

    // Hit particles
    const color = this.type === ENEMY_TYPE.GRUNT ? '#f44' :
                  this.type === ENEMY_TYPE.CHARGER ? '#f84' : '#a4f';
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(this.x, this.y,
        (Math.random() - 0.5) * 250, (Math.random() - 0.5) * 250,
        color, 4, 300));
    }

    if (this.health <= 0) {
      this.dying = true;
      this.dyingTimer = 500;
      // Death burst
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        particles.push(new Particle(this.x, this.y,
          Math.cos(a) * (100 + Math.random() * 200),
          Math.sin(a) * (100 + Math.random() * 200),
          color, 5 + Math.random() * 4, 500 + Math.random() * 300));
      }
      return true; // killed
    }
    return false;
  }

  draw(ctx) {
    if (this.dying) {
      const alpha = Math.max(0, this.dyingTimer / 500);
      const expandR = this.radius * (1 + (1 - alpha) * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      const color = this.type === ENEMY_TYPE.GRUNT ? '#f44' :
                    this.type === ENEMY_TYPE.CHARGER ? '#f84' : '#a4f';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, expandR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const flash = this.hitFlash > 0;
    const bob = Math.sin(this.walkTimer / 70) * 2;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x + 3, this.y + 6, this.radius, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    switch (this.type) {
      case ENEMY_TYPE.GRUNT: {
        // Jagged body (boss is larger, darker)
        const r = this.radius;
        const pts = 12;
        ctx.fillStyle = flash ? '#fff' : (this.isBoss ? '#800' : '#c22');
        ctx.beginPath();
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
          const jag = i % 2 === 0 ? r : r * 0.75;
          const px = Math.cos(a) * jag;
          const py = Math.sin(a) * jag;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        if (this.isBoss) {
          ctx.strokeStyle = flash ? '#fff' : '#f44';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        // Eye
        ctx.fillStyle = flash ? '#f00' : '#fff';
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * r * 0.45, Math.sin(this.angle) * r * 0.45, this.isBoss ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();
        // Boss crown
        if (this.isBoss) {
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < 5; i++) {
            const ca = (i / 5) * Math.PI * 2 + this.walkTimer / 1000;
            ctx.fillRect(Math.cos(ca) * (r + 6) - 4, Math.sin(ca) * (r + 6) - 4, 8, 8);
          }
        }
        break;
      }

      case ENEMY_TYPE.CHARGER: {
        // Triangle pointing toward player
        const r = this.radius;
        ctx.fillStyle = flash ? '#fff' : (this.charging ? '#ff6600' : '#e07020');
        ctx.beginPath();
        ctx.moveTo(Math.cos(this.angle) * r, Math.sin(this.angle) * r);
        ctx.lineTo(Math.cos(this.angle + 2.4) * r * 0.8, Math.sin(this.angle + 2.4) * r * 0.8);
        ctx.lineTo(Math.cos(this.angle - 2.4) * r * 0.8, Math.sin(this.angle - 2.4) * r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = flash ? '#fff' : '#ffaa44';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Charge indicator
        if (!this.charging) {
          const charge = this.chargeTimer / this.chargeDelay;
          ctx.fillStyle = `rgba(255,${Math.floor(charge * 200)},0,0.7)`;
          ctx.beginPath();
          ctx.arc(0, 0, 5 + charge * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case ENEMY_TYPE.SHOOTER: {
        const r = this.radius;
        // Rotate square body slowly
        ctx.rotate(this.walkTimer / 400);
        ctx.fillStyle = flash ? '#fff' : '#7730b0';
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.strokeStyle = flash ? '#fff' : '#bb66ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-r, -r, r * 2, r * 2);
        ctx.rotate(-this.walkTimer / 400);
        // Gun barrel
        ctx.fillStyle = flash ? '#ddd' : '#440066';
        ctx.fillRect(0, -3, r + 4, 6);
        // Charge eye
        const charge = this.shootTimer / this.shootDelay;
        ctx.fillStyle = `rgba(200,120,255,${0.4 + charge * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, 5 + charge * 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Health bar (only if damaged)
    if (this.health < this.maxHealth) {
      const bw = this.radius * 2 + 8;
      const bh = 5;
      const bx = -bw / 2;
      const by = -this.radius - 12;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.health / this.maxHealth > 0.5 ? '#4f4' : '#f84';
      ctx.fillRect(bx, by, bw * (this.health / this.maxHealth), bh);
    }

    ctx.restore();
  }
}

// ─── Level ────────────────────────────────────────────────────────────────────

class Level {
  constructor(levelIndex) {
    this.levelIndex = levelIndex;
    this.config = LEVELS[levelIndex];
    this.waveIndex = 0;
    this.totalWaves = this.config.waves.length;
    this.spawning = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnDelay = 300;
    this.waveActive = false;
    this.waveFlash = 0;
    this.complete = false;
    this.allWavesDone = false;
  }

  startWave(canvasW, canvasH) {
    const waveDef = this.config.waves[this.waveIndex];
    this.spawnQueue = [];
    for (const group of waveDef) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({ type: group.type, speed: group.speed, boss: !!group.boss });
      }
    }
    // Shuffle spawn order
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
    this.spawning = true;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
  }

  update(dt, enemies) {
    if (this.spawning) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        const s = this.spawnQueue.shift();
        enemies.push(this._spawnEnemy(s));
        this.spawnTimer = this.spawnDelay;
      }
      if (this.spawnQueue.length === 0) this.spawning = false;
    }

    if (this.waveFlash > 0) this.waveFlash -= dt;
  }

  _spawnEnemy(s) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 40;
    switch (edge) {
      case 0: x = Math.random() * this.canvasW; y = -margin; break;
      case 1: x = this.canvasW + margin; y = Math.random() * this.canvasH; break;
      case 2: x = Math.random() * this.canvasW; y = this.canvasH + margin; break;
      default: x = -margin; y = Math.random() * this.canvasH; break;
    }
    return new Enemy(x, y, s.type, s.speed, s.boss);
  }

  checkWaveComplete(enemies) {
    if (!this.waveActive) return false;
    if (this.spawning) return false;
    if (enemies.some(e => !e.dead && !e.dying)) return false;

    this.waveActive = false;
    this.waveFlash = 2000;

    if (this.waveIndex + 1 >= this.totalWaves) {
      this.allWavesDone = true;
    } else {
      this.waveIndex++;
    }
    return true;
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

class HUD {
  draw(ctx, player, level, score, canvasW, canvasH) {
    ctx.save();

    // Health bar
    const hbw = 200, hbh = 20;
    const hbx = 20, hby = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(hbx - 4, hby - 4, hbw + 8, hbh + 8);
    ctx.fillStyle = '#400';
    ctx.fillRect(hbx, hby, hbw, hbh);
    const hp = player.health / player.maxHealth;
    ctx.fillStyle = hp > 0.6 ? '#4f4' : hp > 0.3 ? '#fa0' : '#f33';
    ctx.fillRect(hbx, hby, hbw * hp, hbh);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(hbx, hby, hbw, hbh);

    // Heart icon
    ctx.fillStyle = '#f44';
    ctx.font = '18px monospace';
    ctx.fillText('♥', hbx - 22, hby + 15);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${player.health}/${player.maxHealth}`, hbx + 4, hby + 14);

    // Score (top-right)
    ctx.fillStyle = '#FFE44D';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, canvasW - 20, 38);
    ctx.fillStyle = '#aaa';
    ctx.font = '13px monospace';
    ctx.fillText('SCORE', canvasW - 20, 20);

    // Level/wave (bottom-left)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`LVL ${level.levelIndex + 1}  WAVE ${Math.min(level.waveIndex + 1, level.totalWaves)}/${level.totalWaves}`, 20, canvasH - 45);

    // Ammo (bottom-right)
    ctx.textAlign = 'right';
    if (player.reloading) {
      const prog = 1 - player.reloadTimer / player.reloadTime;
      ctx.fillStyle = '#fa0';
      ctx.fillText(`RELOADING ${Math.floor(prog * 100)}%`, canvasW - 20, canvasH - 45);
    } else {
      ctx.fillStyle = player.ammo <= 5 ? '#f44' : '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${player.ammo}`, canvasW - 20, canvasH - 45);
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
      ctx.fillText(` /${player.reserve}`, canvasW - 20 - 30, canvasH - 45);
    }

    // Wave flash message
    if (level.waveFlash > 0 && !level.allWavesDone) {
      const alpha = Math.min(1, level.waveFlash / 500) * Math.min(1, (level.waveFlash) / 2000 * 4);
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      const prevWave = level.waveIndex; // already incremented
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px monospace';
      ctx.shadowColor = '#FFE44D';
      ctx.shadowBlur = 20;
      ctx.fillText(`WAVE ${prevWave} COMPLETE`, canvasW / 2, canvasH / 2 - 20);
      ctx.fillStyle = '#FFE44D';
      ctx.font = '20px monospace';
      ctx.fillText(`+${SCORES.WAVE_BONUS}`, canvasW / 2, canvasH / 2 + 16);
      ctx.shadowBlur = 0;
    }

    // Pause indicator
    ctx.restore();
  }
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

class Renderer {
  static drawBackground(ctx, w, h, time) {
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  static drawMenu(ctx, w, h, time, menuParticles) {
    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    // Animated particles
    for (const p of menuParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Title
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 30 + Math.sin(time / 400) * 10;
    ctx.fillStyle = '#ff2222';
    ctx.font = `bold ${Math.floor(w / 12)}px 'Courier New', monospace`;
    ctx.fillText('DEAD ZONE', w / 2, h * 0.28);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#666';
    ctx.font = `${Math.floor(w / 55)}px monospace`;
    ctx.fillText('TOP-DOWN SHOOTER', w / 2, h * 0.36);
  }

  static drawButton(ctx, label, x, y, w, h, hover) {
    ctx.save();
    ctx.fillStyle = hover ? 'rgba(255,50,50,0.3)' : 'rgba(20,20,30,0.9)';
    ctx.strokeStyle = hover ? '#ff4444' : '#444';
    ctx.lineWidth = 2;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = hover ? '#ff8888' : '#ccc';
    ctx.font = `bold ${Math.floor(h * 0.5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  static drawLevelComplete(ctx, w, h, level, score, accuracy, player) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';

    const isLast = level.levelIndex >= LEVELS.length - 1;

    ctx.shadowColor = '#FFE44D';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFE44D';
    ctx.font = `bold ${Math.floor(w / 16)}px monospace`;
    ctx.fillText(isLast ? 'VICTORY!' : `LEVEL ${level.levelIndex + 1} COMPLETE`, w / 2, h * 0.3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ccc';
    ctx.font = `${Math.floor(w / 40)}px monospace`;
    const lineH = Math.floor(w / 36);
    ctx.fillText(`Score: ${score}`, w / 2, h * 0.44);
    ctx.fillText(`Accuracy: ${Math.floor(accuracy * 100)}%`, w / 2, h * 0.44 + lineH);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, w / 2, h * 0.44 + lineH * 2);

    const bonus = 1000 * (level.levelIndex + 1);
    ctx.fillStyle = '#FFE44D';
    ctx.fillText(`Level Bonus: +${bonus}`, w / 2, h * 0.44 + lineH * 3.5);
  }

  static drawGameOver(ctx, w, h, score) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';

    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ff3333';
    ctx.font = `bold ${Math.floor(w / 12)}px monospace`;
    ctx.fillText('GAME OVER', w / 2, h * 0.35);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.floor(w / 35)}px monospace`;
    ctx.fillText(`Final Score: ${score}`, w / 2, h * 0.48);
  }

  static drawPause(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(w / 14)}px monospace`;
    ctx.fillText('PAUSED', w / 2, h / 2);
    ctx.fillStyle = '#888';
    ctx.font = `${Math.floor(w / 45)}px monospace`;
    ctx.fillText('Press P to resume', w / 2, h / 2 + Math.floor(w / 20));
  }
}

// ─── Game ─────────────────────────────────────────────────────────────────────

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputHandler(this.canvas);
    this.hud = new HUD();
    this.state = STATE.MENU;

    this.score = 0;
    this.levelIndex = 0;
    this.time = 0;

    // Menu
    this.menuParticles = [];
    this._initMenuParticles();
    this.menuButtons = [
      { label: 'START GAME', action: () => this._startGame() },
      { label: 'HOW TO PLAY', action: () => this._showHowToPlay() },
    ];
    this.showingHowTo = false;

    // P key debounce
    this._pWasDown = false;
    this._escWasDown = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _initMenuParticles() {
    const w = window.innerWidth || 800;
    const h = window.innerHeight || 600;
    for (let i = 0; i < 60; i++) {
      this.menuParticles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
        r: 1 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.3,
        color: Math.random() < 0.3 ? '#f44' : '#334'
      });
    }
  }

  _startGame() {
    this.score = 0;
    this.levelIndex = 0;
    this.showingHowTo = false;
    this._initLevel();
    this.state = STATE.PLAYING;
  }

  _initLevel() {
    const w = this.canvas.width, h = this.canvas.height;
    this.player = new Player(w / 2, h / 2);
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.level = new Level(this.levelIndex);
    this.level.startWave(w, h);
    this._levelCompleteTimer = 0;
  }

  _showHowToPlay() {
    this.showingHowTo = !this.showingHowTo;
  }

  _loop(timestamp) {
    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;
    this.time += dt;

    this.input.update();
    this._handleGlobalInput();
    this._update(dt);
    this._draw();

    requestAnimationFrame(t => this._loop(t));
  }

  _handleGlobalInput() {
    // P to pause
    const pDown = this.input.isDown('KeyP') || this.input.isDown('p');
    if (pDown && !this._pWasDown) {
      if (this.state === STATE.PLAYING) this.state = STATE.PAUSED;
      else if (this.state === STATE.PAUSED) this.state = STATE.PLAYING;
    }
    this._pWasDown = pDown;

    // ESC to menu
    const escDown = this.input.isDown('Escape');
    if (escDown && !this._escWasDown) {
      if (this.state !== STATE.MENU) {
        this.state = STATE.MENU;
        this.showingHowTo = false;
      }
    }
    this._escWasDown = escDown;
  }

  _update(dt) {
    switch (this.state) {
      case STATE.MENU:
        this._updateMenu(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.LEVEL_COMPLETE:
        this._levelCompleteTimer -= dt;
        // Wait for click
        break;
      case STATE.GAME_OVER:
      case STATE.VICTORY:
        // Wait for click (handled in draw/input)
        break;
    }
  }

  _updateMenu(dt) {
    const w = this.canvas.width, h = this.canvas.height;
    for (const p of this.menuParticles) {
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
    }
  }

  _updatePlaying(dt) {
    const w = this.canvas.width, h = this.canvas.height;

    this.player.update(dt, this.input, this.bullets, this.particles);
    this.player.clampToBounds(w, h);

    this.level.update(dt, this.enemies);

    for (const e of this.enemies) {
      e.update(dt, this.player, this.bullets, this.particles);
    }

    for (const b of this.bullets) {
      b.update(dt, w, h);
    }

    for (const p of this.particles) {
      p.update(dt);
    }

    this._checkCollisions();
    this._checkWaveComplete(w, h);

    // Clean up dead objects
    this.enemies = this.enemies.filter(e => !e.dead);
    this.bullets = this.bullets.filter(b => !b.dead);
    this.particles = this.particles.filter(p => !p.dead);

    if (this.player.dead) {
      this.state = STATE.GAME_OVER;
    }
  }

  _checkCollisions() {
    // Player bullets hit enemies
    for (const b of this.bullets) {
      if (b.dead || !b.fromPlayer) continue;
      for (const e of this.enemies) {
        if (e.dead || e.dying) continue;
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx * dx + dy * dy < (b.radius + e.radius) ** 2) {
          b.dead = true;
          const killed = e.takeDamage(25, this.particles);
          if (killed) {
            this.score += e.score;
            this.player.shotsHit++;
          }
          break;
        }
      }
    }

    // Enemy bullets hit player
    for (const b of this.bullets) {
      if (b.dead || b.fromPlayer) continue;
      const dx = b.x - this.player.x, dy = b.y - this.player.y;
      if (dx * dx + dy * dy < (b.radius + this.player.radius) ** 2) {
        b.dead = true;
        this.player.takeDamage(15, b.x - b.vx * 0.01, b.y - b.vy * 0.01);
      }
    }

    // Enemies contact player
    for (const e of this.enemies) {
      if (e.dead || e.dying) continue;
      const dx = e.x - this.player.x, dy = e.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < e.radius + this.player.radius) {
        this.player.takeDamage(e.damage, e.x, e.y);
        // Push enemy back slightly
        if (dist > 0) {
          e.x += (dx / dist) * 10;
          e.y += (dy / dist) * 10;
        }
      }
    }
  }

  _checkWaveComplete(w, h) {
    const waveCleared = this.level.checkWaveComplete(this.enemies);
    if (waveCleared) {
      this.score += SCORES.WAVE_BONUS;

      if (this.level.allWavesDone) {
        // Level complete
        const levelBonus = 1000 * (this.levelIndex + 1);
        this.score += levelBonus;
        this.state = STATE.LEVEL_COMPLETE;
        this._levelCompleteTimer = 0;
      } else {
        // Start next wave after brief delay
        setTimeout(() => {
          if (this.state === STATE.PLAYING) {
            this.level.startWave(w, h);
          }
        }, 2200);
      }
    }
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;

    switch (this.state) {
      case STATE.MENU:
        this._drawMenu(ctx, w, h);
        break;
      case STATE.PLAYING:
      case STATE.PAUSED:
        this._drawPlaying(ctx, w, h);
        if (this.state === STATE.PAUSED) Renderer.drawPause(ctx, w, h);
        break;
      case STATE.LEVEL_COMPLETE:
        this._drawPlaying(ctx, w, h);
        const acc = this.player.shotsFired > 0 ? this.player.shotsHit / this.player.shotsFired : 0;
        Renderer.drawLevelComplete(ctx, w, h, this.level, this.score, acc, this.player);
        this._drawLevelCompleteButtons(ctx, w, h);
        break;
      case STATE.GAME_OVER:
        this._drawPlaying(ctx, w, h);
        Renderer.drawGameOver(ctx, w, h, this.score);
        this._drawGameOverButtons(ctx, w, h);
        break;
      case STATE.VICTORY:
        this._drawPlaying(ctx, w, h);
        Renderer.drawLevelComplete(ctx, w, h, this.level, this.score, this.player.shotsFired > 0 ? this.player.shotsHit / this.player.shotsFired : 0, this.player);
        this._drawVictoryButtons(ctx, w, h);
        break;
    }
  }

  _drawPlaying(ctx, w, h) {
    Renderer.drawBackground(ctx, w, h, this.time);

    for (const p of this.particles) p.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    if (!this.player.dead) this.player.draw(ctx);

    this.hud.draw(ctx, this.player, this.level, this.score, w, h);
  }

  _drawMenu(ctx, w, h) {
    Renderer.drawMenu(ctx, w, h, this.time, this.menuParticles);

    if (this.showingHowTo) {
      this._drawHowToPlay(ctx, w, h);
      return;
    }

    const bw = Math.min(280, w * 0.4), bh = 52;
    const bx = w / 2;
    const startY = h * 0.5;

    for (let i = 0; i < this.menuButtons.length; i++) {
      const by = startY + i * (bh + 16);
      const mx = this.input.mouse.x, my = this.input.mouse.y;
      const hover = Math.abs(mx - bx) < bw / 2 && Math.abs(my - by) < bh / 2;
      Renderer.drawButton(ctx, this.menuButtons[i].label, bx, by, bw, bh, hover);
      if (hover && this.input.mouse.leftJustPressed) {
        this.menuButtons[i].action();
      }
    }

    // ESC hint
    ctx.fillStyle = '#333';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESC: back to menu while playing', w / 2, h - 20);
  }

  _drawHowToPlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFE44D';
    ctx.font = `bold ${Math.floor(w / 22)}px monospace`;
    ctx.fillText('HOW TO PLAY', w / 2, h * 0.2);

    const lines = [
      'WASD / Arrow Keys  — Move',
      'Mouse              — Aim',
      'Left Click         — Shoot',
      'R                  — Reload',
      'P                  — Pause',
      'ESC                — Back to menu',
      '',
      'Kill all enemies each wave to advance.',
      '',
      'ENEMIES:',
      'RED BLOB   — Grunt. Walks toward you.',
      'ORANGE TRI — Charger. Bursts at speed.',
      'PURPLE SQ  — Shooter. Keeps distance, fires.',
    ];

    ctx.fillStyle = '#bbb';
    ctx.font = `${Math.floor(w / 55)}px monospace`;
    const lineH = Math.floor(w / 50);
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, h * 0.3 + i * lineH);
    });

    const bw = 200, bh = 44;
    const bx = w / 2, by = h * 0.85;
    const mx = this.input.mouse.x, my = this.input.mouse.y;
    const hover = Math.abs(mx - bx) < bw / 2 && Math.abs(my - by) < bh / 2;
    Renderer.drawButton(ctx, 'BACK', bx, by, bw, bh, hover);
    if (hover && this.input.mouse.leftJustPressed) this.showingHowTo = false;
  }

  _drawLevelCompleteButtons(ctx, w, h) {
    const isLast = this.levelIndex >= LEVELS.length - 1;
    const label = isLast ? 'FINISH' : 'NEXT LEVEL';
    const bw = 240, bh = 52;
    const bx = w / 2, by = h * 0.72;
    const mx = this.input.mouse.x, my = this.input.mouse.y;
    const hover = Math.abs(mx - bx) < bw / 2 && Math.abs(my - by) < bh / 2;
    Renderer.drawButton(ctx, label, bx, by, bw, bh, hover);
    if (hover && this.input.mouse.leftJustPressed) {
      if (isLast) {
        this.state = STATE.VICTORY;
      } else {
        this.levelIndex++;
        this._initLevel();
        this.state = STATE.PLAYING;
      }
    }

    const ebx = w / 2, eby = by + bh + 16;
    const ehover = Math.abs(mx - ebx) < bw / 2 && Math.abs(my - eby) < bh / 2;
    Renderer.drawButton(ctx, 'MAIN MENU', ebx, eby, bw, bh, ehover);
    if (ehover && this.input.mouse.leftJustPressed) {
      this.state = STATE.MENU;
    }
  }

  _drawGameOverButtons(ctx, w, h) {
    const bw = 220, bh = 52;
    const buttons = [
      { label: 'RETRY', y: h * 0.62, action: () => { this._startGame(); } },
      { label: 'MAIN MENU', y: h * 0.62 + bh + 16, action: () => { this.state = STATE.MENU; } },
    ];
    const mx = this.input.mouse.x, my = this.input.mouse.y;
    for (const btn of buttons) {
      const hover = Math.abs(mx - w / 2) < bw / 2 && Math.abs(my - btn.y) < bh / 2;
      Renderer.drawButton(ctx, btn.label, w / 2, btn.y, bw, bh, hover);
      if (hover && this.input.mouse.leftJustPressed) btn.action();
    }
  }

  _drawVictoryButtons(ctx, w, h) {
    const bw = 220, bh = 52;
    const bx = w / 2, by = h * 0.75;
    const mx = this.input.mouse.x, my = this.input.mouse.y;
    const hover = Math.abs(mx - bx) < bw / 2 && Math.abs(my - by) < bh / 2;
    Renderer.drawButton(ctx, 'MAIN MENU', bx, by, bw, bh, hover);
    if (hover && this.input.mouse.leftJustPressed) {
      this.state = STATE.MENU;
    }
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => { new Game(); });
