import { screenFromWorld, worldFromGrid } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";

const faceStyles = {
  north: colors.tileSideLeft,
  east: colors.tileSideRight,
  south: colors.tileSideLeft,
  west: colors.tileSideRight,
};

const facePoints = {
  north: northFace,
  east: eastFace,
  south: southFace,
  west: westFace,
};

export function tileCenter(canvas, gridPoint, height = 0) {
  const point = worldFromGrid(canvas, gridPoint.x + 0.5, gridPoint.y + 0.5, height);

  return screenFromWorld(point);
}

export function voxelPrimitives(canvas, gridPoint, height, faces, style) {
  return [
    ...sidePrimitives(canvas, gridPoint, height, faces, style),
    topPrimitive(canvas, gridPoint, height, style),
  ];
}

export function drawVoxelPrimitive(context, primitive) {
  if (primitive.kind === "top") {
    drawDiamond(context, primitive.corners, primitive.fill, primitive.stroke, primitive.lineWidth);
    return;
  }

  drawFace(context, primitive.points, primitive.fill);
}

export function screenDiamond(canvas, gridPoint, scale, height = 0) {
  const inset = (1 - scale) / 2;

  return {
    top: screenGridPoint(canvas, gridPoint.x + inset, gridPoint.y + inset, height),
    right: screenGridPoint(canvas, gridPoint.x + 1 - inset, gridPoint.y + inset, height),
    bottom: screenGridPoint(canvas, gridPoint.x + 1 - inset, gridPoint.y + 1 - inset, height),
    left: screenGridPoint(canvas, gridPoint.x + inset, gridPoint.y + 1 - inset, height),
  };
}

export function tileDepth(canvas, gridPoint) {
  return tileCenter(canvas, gridPoint, terrainHeight.min).y;
}

function sidePrimitives(canvas, gridPoint, height, faces, style) {
  return faces.flatMap((face) => sideSlabPrimitives(canvas, gridPoint, height, face, style));
}

function sideSlabPrimitives(canvas, gridPoint, height, face, style) {
  const slabs = [];

  for (let z = face.height + 1; z <= height; z += 1) {
    slabs.push(sidePrimitive(canvas, gridPoint, face, z, style));
  }

  return slabs;
}

function sidePrimitive(canvas, gridPoint, face, topHeight, style) {
  const bottomHeight = topHeight - 1;
  const points = facePoints[face.direction](canvas, gridPoint, topHeight, bottomHeight);

  return {
    kind: "side",
    depth: primitiveDepth(canvas, gridPoint, topHeight),
    fill: sideFill(face.direction, style),
    points,
  };
}

function sideFill(direction, style) {
  return faceStyles[direction] === colors.tileSideLeft
    ? style.sideLeft ?? faceStyles[direction]
    : style.sideRight ?? faceStyles[direction];
}

function topPrimitive(canvas, gridPoint, height, style) {
  const corners = screenDiamond(canvas, gridPoint, 1, height);

  return {
    kind: "top",
    depth: primitiveDepth(canvas, gridPoint, height),
    corners,
    fill: style.fill,
    stroke: style.stroke,
    lineWidth: style.lineWidth,
  };
}

function northFace(canvas, gridPoint, topHeight, bottomHeight) {
  const top = screenDiamond(canvas, gridPoint, 1, topHeight);
  const bottom = screenDiamond(canvas, gridPoint, 1, bottomHeight);

  return [top.top, top.right, bottom.right, bottom.top];
}

function eastFace(canvas, gridPoint, topHeight, bottomHeight) {
  const top = screenDiamond(canvas, gridPoint, 1, topHeight);
  const bottom = screenDiamond(canvas, gridPoint, 1, bottomHeight);

  return [top.right, top.bottom, bottom.bottom, bottom.right];
}

function southFace(canvas, gridPoint, topHeight, bottomHeight) {
  const top = screenDiamond(canvas, gridPoint, 1, topHeight);
  const bottom = screenDiamond(canvas, gridPoint, 1, bottomHeight);

  return [top.left, top.bottom, bottom.bottom, bottom.left];
}

function westFace(canvas, gridPoint, topHeight, bottomHeight) {
  const top = screenDiamond(canvas, gridPoint, 1, topHeight);
  const bottom = screenDiamond(canvas, gridPoint, 1, bottomHeight);

  return [top.top, top.left, bottom.left, bottom.top];
}

function drawDiamond(context, corners, fill, stroke, lineWidth) {
  pathDiamond(context, corners);
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.lineJoin = "miter";
  context.stroke();
}

function drawFace(context, points, fill) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

function primitiveDepth(canvas, gridPoint, height) {
  return tileDepth(canvas, gridPoint) + height * terrainHeight.step;
}

function pathDiamond(context, corners) {
  context.beginPath();
  context.moveTo(corners.top.x, corners.top.y);
  context.lineTo(corners.right.x, corners.right.y);
  context.lineTo(corners.bottom.x, corners.bottom.y);
  context.lineTo(corners.left.x, corners.left.y);
  context.closePath();
}

function screenGridPoint(canvas, x, y, height) {
  return screenFromWorld(worldFromGrid(canvas, x, y, height));
}
