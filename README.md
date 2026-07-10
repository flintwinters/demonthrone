<div align="center">

# Demonthrone

</div>

Demonthrone is a tactical, turn-based roguelike where you command a team of adventurers through a procedurally generated world. Each character has unique stats and skills. Navigate through forests and across rivers, battling enemies and gathering resources. The game features a dynamic fog of war system, requiring careful exploration and positioning of your team to succeed.
- Squad / Party based Roguelike

## todo

- [ ] actual world gen (high prio)
- [ ] save and load game state

- [ ] direction-dependent vision multipliers (for uphill or downhill sight)

- [ ] probably come up with a better name
- [ ] actual character info display in the UI
- [ ] items & inventory
- [ ] more than one enemy
- [ ] more than one obstacle - destructible obstacles

## Backend

Run the zero-dependency Python backend from the project root:

```sh
python -m backend.app
```

The backend serves the static browser app at `http://127.0.0.1:8001` and exposes:

- `GET /api/health`
- `GET /api/game/new`

Run backend tests with:

```sh
python -m unittest discover
```
