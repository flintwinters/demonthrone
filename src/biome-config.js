import { BiomeProfile } from "./domain.js";
const worldSeed = 0x5eedf;
export const biomes = {
    cinder: profile({
        kind: "cinder",
        height: { base: 0.18, components: [
                component(0.048, 0x7099, "terraced", 0.42),
                component(0.001, 0xcd73, "centered", 0.4),
                component(0.1, 0x1f91, "crest", 0.16),
                component(0.055, 0x1234, "centered", 0.12),
                component(0.19, 0xa713, "centered", 0.07),
                component(0.34, 0xe241, "centered", 0.035),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.77),
        brush: { ...feature(0.31, 0x4b1d, 0.78), sightCost: 4 },
        water: feature(0.075, 0x77a3, 0.9),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
    fen: profile({
        kind: "fen",
        height: { base: 0.22, components: [
                component(0.038, 0x4a87, "linear", 0.24),
                component(0.001, 0xcd73, "centered", 0.4),
                component(0.06, 0x4321, "linear", -0.16),
                component(0.1, 0x1f91, "centered", 0.06),
                component(0.18, 0xb527, "centered", 0.055),
                component(0.31, 0xf135, "centered", 0.025),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.91),
        brush: { ...feature(0.31, 0x4b1d, 0.5), sightCost: 6 },
        water: feature(0.075, 0x77a3, 0.58),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
    heath: profile({
        kind: "heath",
        height: { base: 0.12, components: [
                component(0.07, 0x39c1, "linear", 0.52),
                component(0.001, 0xcd73, "centered", 0.4),
                component(0.055, 0x1234, "centered", 0.1),
                component(0.1, 0x1f91, "centered", 0.14),
                component(0.2, 0x971b, "centered", 0.075),
                component(0.36, 0xd649, "centered", 0.035),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.85),
        brush: { ...feature(0.31, 0x4b1d, 0.62), sightCost: 4 },
        water: feature(0.075, 0x77a3, 0.78),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
    ridge: profile({
        kind: "ridge",
        height: { base: 0.32, components: [
                component(0.085, 0x55ad, "crest", 0.34),
                component(0.001, 0xcd73, "centered", 0.4),
                component(0.13, 0x6d2b, "linear", 0.22),
                component(0.1, 0x1f91, "centered", 0.28),
                component(0.22, 0x853d, "crest", 0.085),
                component(0.4, 0xc761, "centered", 0.04),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.73),
        brush: { ...feature(0.31, 0x4b1d, 0.72), sightCost: 5 },
        water: feature(0.075, 0x77a3, 0.88),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
    bog: profile({
        kind: "bog",
        height: { base: 0.06, components: [
                component(0.052, 0x3f11, "linear", 0.39),
                component(0.001, 0xcd73, "centered", 0.4),
                component(0.06, 0x4321, "linear", 0.4),
                component(0.1, 0x1f91, "centered", 0.1),
                component(0.17, 0xb943, "centered", 0.045),
                component(0.3, 0xe857, "centered", 0.02),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.95),
        brush: { ...feature(0.31, 0x4b1d, 0.44), sightCost: 5.5 },
        water: feature(0.075, 0x77a3, 0.7),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
    mesa: profile({
        kind: "mesa",
        height: { base: 0.33, components: [
                component(0.06, 0x8f6e, "terraced", 0.34),
                component(0.001, 0xcd73, "centered", 0.44),
                component(0.13, 0x6d2b, "linear", 0.18),
                component(0.1, 0x1f91, "centered", 0.12),
                component(0.21, 0x934f, "terraced", 0.07),
                component(0.38, 0xda65, "centered", 0.03),
            ] },
        boulder: feature(0.23, 0x2b0d, 0.78),
        brush: { ...feature(0.31, 0x4b1d, 0.68), sightCost: 5 },
        water: feature(0.075, 0x77a3, 0.86),
        ice: feature(0.11, 0x1ce5, 0.55),
    }),
};
function profile(config) {
    return new BiomeProfile(config);
}
function noise(scale, salt, magnitude) {
    return { scale, magnitude, seed: worldSeed ^ salt };
}
function feature(scale, salt, threshold, magnitude = 1) {
    return { ...noise(scale, salt, magnitude), threshold };
}
function component(scale, salt, sample, weight, magnitude = 1) {
    return { ...noise(scale, salt, magnitude), sample, weight };
}
