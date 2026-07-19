<div align="center">

# Demonthrone

</div>

Demonthrone is a browser-based, squad tactics roguelike prototype rendered as a
crisp isometric Three.js voxel world. Command four teammates with sharply
different sight, movement, range, and health profiles across an unbounded,
height-aware procedural battlefield.

## Current features

- Six deterministic biomes with layered elevation, boulders, foliage, basin
  water and ice, contour-following rivers, and climbable brick walls.
- Weighted, obstacle-aware movement with reciprocal uphill and downhill slope
  costs, simultaneous destination previews, and terrain-specific movement
  penalties.
- Height-aware fog of war and exact attack line of sight through terrain,
  boulders, foliage, teammates, and enemies.
- Four-teammate roster: vanguard, warden, varmint, and marauder.
- Procedurally materialized pursuers and nephilim with distinct health, damage,
  range, shapes, and movement cadence.
- Attacks against enemies and crates, pushable crates, and crate enchantments
  that can form and dispel follower chains.
- One shared teammate action per planning phase, with enemy line-of-sight
  attacks and pursuit during turn resolution.
- Cached movement, attack, and visibility fields; instanced props and batched
  terrain rendering keep the coordinate-unbounded board responsive.
- Compact health labels, enemy inspection overlays, terrain inspection, a
  camera-relative compass, one-turn tombstones, and a game-over reveal centered
  on the final casualty.

## Controls

- Click a teammate, then a highlighted tile or target to plan the team action.
- Click and drag to pan; use the wheel or a pinch gesture to zoom.
- Right-drag vertically or horizontally to pitch and rotate the camera. The
  on-screen rotation buttons provide touch-friendly rotation.
- Press `Enter` or click `go` to resolve the turn.
- Press `Escape`, click the active selection again, or select a teammate to
  cancel the current interaction.
- Select a crate first to bind it to a teammate or an existing enchanted chain;
  select the source again to cancel or dispel it.

## Local development

Fetch the pinned frontend dependencies once with `npm ci`. Then use the root
management entrypoint to build and run the game:

```sh
python manage.py
```

This single command builds the TypeScript first, then serves the browser app at
`http://127.0.0.1:8001`. `npm start` is equivalent. Use
`python manage.py runserver --no-build` to intentionally serve existing output,
or `python manage.py build` to compile without starting the server.

## Verification

Run the complete frontend build, lint, test, and syntax gate:

```sh
npm run check
```

Run the Python backend and management tests:

```sh
python -m unittest discover
```

## Backend API

The standard-library backend serves only the browser runtime assets and exposes:

- `GET /api/health`
- `GET /api/game/new`

## Planned work

- Save and load.
- Items and inventory.
- Richer character inspection.
- Direction-dependent uphill and downhill vision.
