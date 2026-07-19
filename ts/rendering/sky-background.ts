import * as THREE from "three";

export function skyBackground(bottom: string, top: string): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    new Uint8Array([...colorBytes(bottom), ...colorBytes(top)]),
    1,
    2,
    THREE.RGBAFormat,
  );

  texture.name = "sky-background-gradient";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function colorBytes(color: string): readonly number[] {
  const value = new THREE.Color(color).getHex(THREE.SRGBColorSpace);

  return [value >> 16, (value >> 8) & 0xff, value & 0xff, 0xff];
}
