# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Projects

No build system, no dependencies, no server required. Open any HTML file directly in a browser:

```
shooter/index.html   — DEAD ZONE top-down shooter
tictactoe.html       — Tic Tac Toe
```

On Windows: `start "" "shooter/index.html"` from the repo root.

## Git Workflow

All changes should be committed and pushed to GitHub after completion:

```bash
git add <files>
git commit -m "descriptive message"
git push
```

Remote: `https://github.com/williambuchanan2/ClaudeTraining` (branch: `master`)

---

## DEAD ZONE — Shooter Architecture (`shooter/`)

Everything lives in one file: `shooter/game.js`. No module system.

### State Machine

```
MENU → PLAYING → LEVEL_COMPLETE → PLAYING (next level)
                               ↘ VICTORY (after level 5)
       PLAYING → PAUSED → PLAYING
       PLAYING → GAME_OVER → MENU
```

`Game.state` is a string from the `STATE` constant object. All update and draw logic is branched on this value in `Game._update()` and `Game._draw()`.

### Class Responsibilities

| Class | File location | Key role |
|---|---|---|
| `Game` | bottom of file | State machine, RAF loop, input wiring, collision detection, wave/level progression |
| `Player` | mid-file | WASD movement, mouse aim (`Math.atan2`), shooting, reload, knockback, walk animation |
| `Enemy` | mid-file | Three subtypes via `this.type` switch; AI movement, charge logic, strafe+shoot logic |
| `Bullet` | mid-file | Velocity, trail array, out-of-bounds removal |
| `Particle` | mid-file | Single-use visual effect: velocity + alpha fade over `life` ms |
| `Level` | mid-file | Wave spawn queue with 300ms stagger; delegates to `Enemy` constructor |
| `Renderer` | mid-file | Static-only draw helpers: background grid, menu, buttons, overlays |
| `HUD` | mid-file | Health bar, score, ammo, wave flash message |
| `InputHandler` | top of file | Keyboard map + mouse position/button; canvas coordinate scaling for any window size |

### Game Loop Pattern

```js
// RAF → _loop(timestamp)
dt = clamp(timestamp - lastTime, 0, 50)   // spiral-of-death guard
input.update()                             // compute leftJustPressed
_update(dt)                                // state-branched logic
_draw()                                    // state-branched rendering
```

All entity updates receive `dt` in milliseconds. Velocities are stored as px/sec and applied as `v * dt / 1000`.

### Level Data

Levels are defined in the top-level `LEVELS` array. Each entry contains `waves: []`, each wave is an array of spawn groups:

```js
{ type: ENEMY_TYPE.GRUNT, count: 6, speed: 75, boss: false }
```

`boss: true` on a GRUNT group creates the oversized mini-boss (500 HP, radius 32). Add new levels by appending to `LEVELS`.

### Enemy Types

| Constant | Shape | AI behavior |
|---|---|---|
| `ENEMY_TYPE.GRUNT` | Jagged red circle | Walks straight toward player |
| `ENEMY_TYPE.CHARGER` | Orange triangle | Slow approach, periodic speed burst toward player |
| `ENEMY_TYPE.SHOOTER` | Rotating purple square | Maintains preferred distance (250px), strafes, fires projectiles |

Adding a new enemy type requires: a new constant, a new `case` in `Enemy.constructor` (stats), `Enemy.update` (AI), and `Enemy.draw` (shape).

### Collision Detection

All collision is circle-circle: `dx² + dy² < (r1 + r2)²`. Checked in `Game._checkCollisions()`:
- Player bullets → enemies (damage 25/hit)
- Enemy bullets → player (damage 15/hit)
- Enemy body contact → player (damage = `e.damage`, triggers knockback + brief invincibility via `hitFlash`)

### Canvas Coordinate Scaling

`InputHandler` scales raw mouse client coords against `canvas.getBoundingClientRect()` so mouse aim works correctly at any CSS-scaled canvas size. The canvas is always set to `window.innerWidth × window.innerHeight` on resize.

### Procedural Art Conventions

- All sprites are drawn with arcs, `fillRect`, and `moveTo/lineTo` — no images
- Walk cycle: `Math.sin(walkTimer / 80) * amplitude` offsets legs/body
- Hit flash: entity draws white (`#fff`) fill while `hitFlash > 0` (countdown in ms)
- Death: `dying = true`, `dyingTimer = 500ms` — expanding ring drawn, entity removed when timer reaches 0
- Muzzle flash: `muzzleFlash > 0` countdown, bright arc drawn at gun tip with `shadowBlur`
