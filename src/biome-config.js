import { BiomeProfile } from "./domain.js";
export function createBiomes(worldSeed, heightComponents) {
    const feature = featureFactory(worldSeed);
    return {
        cinder: profile({
            kind: "cinder", height: { base: 0.18, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.77),
            brush: { ...feature(0.31, 0x4b1d, 0.78), sightCost: 4 },
            water: feature(0.075, 0x77a3, 0.9), ice: feature(0.11, 0x1ce5, 0.55),
        }),
        fen: profile({
            kind: "fen", height: { base: 0.22, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.91),
            brush: { ...feature(0.31, 0x4b1d, 0.5), sightCost: 6 },
            water: feature(0.075, 0x77a3, 0.58), ice: feature(0.11, 0x1ce5, 0.55),
        }),
        heath: profile({
            kind: "heath", height: { base: 0.12, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.85),
            brush: { ...feature(0.31, 0x4b1d, 0.62), sightCost: 4 },
            water: feature(0.075, 0x77a3, 0.78), ice: feature(0.11, 0x1ce5, 0.55),
        }),
        ridge: profile({
            kind: "ridge", height: { base: 0.32, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.73),
            brush: { ...feature(0.31, 0x4b1d, 0.72), sightCost: 5 },
            water: feature(0.075, 0x77a3, 0.88), ice: feature(0.11, 0x1ce5, 0.55),
        }),
        bog: profile({
            kind: "bog", height: { base: 0.06, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.95),
            brush: { ...feature(0.31, 0x4b1d, 0.44), sightCost: 5.5 },
            water: feature(0.075, 0x77a3, 0.7), ice: feature(0.11, 0x1ce5, 0.55),
        }),
        mesa: profile({
            kind: "mesa", height: { base: 0.33, components: heightComponents },
            boulder: feature(0.23, 0x2b0d, 0.78),
            brush: { ...feature(0.31, 0x4b1d, 0.68), sightCost: 5 },
            water: feature(0.075, 0x77a3, 0.86), ice: feature(0.11, 0x1ce5, 0.55),
        }),
    };
}
function profile(config) {
    return new BiomeProfile(config);
}
function featureFactory(worldSeed) {
    return (scale, salt, threshold, magnitude = 1) => ({ scale, magnitude, seed: worldSeed ^ salt, threshold });
}
