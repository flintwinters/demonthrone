export function perlinNoise2d(x, y, seed) {
  const cell = {
    x: Math.floor(x),
    y: Math.floor(y),
  };
  const offset = {
    x: x - cell.x,
    y: y - cell.y,
  };
  const lower = interpolateGrid(cell, offset, seed);
  const upper = interpolateGrid({ x: cell.x, y: cell.y + 1 }, offset, seed);

  return normalize(lerp(lower, upper, fade(offset.y)));
}

function interpolateGrid(cell, offset, seed) {
  const left = dotGradient(cell, offset, seed);
  const right = dotGradient({ x: cell.x + 1, y: cell.y }, { x: offset.x - 1, y: offset.y }, seed);

  return lerp(left, right, fade(offset.x));
}

function dotGradient(cell, offset, seed) {
  const gradient = gradientAt(cell, seed);

  return gradient.x * offset.x + gradient.y * offset.y;
}

function gradientAt(cell, seed) {
  const angle = hashUnit(cell, seed) * Math.PI * 2;

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

function hashUnit(cell, seed) {
  const hash = Math.imul(cell.x, 374761393) + Math.imul(cell.y, 668265263) + seed;
  const mixed = Math.imul(hash ^ hash >>> 13, 1274126177);

  return (mixed >>> 0) / 0x100000000;
}

function fade(value) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function normalize(value) {
  return Math.max(0, Math.min(1, value + 0.5));
}
