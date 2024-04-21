import { Point } from "../../../common/point.js";

export const biomes = {
    desert: {
        color: "#f2d357",
        modifier: 5,
        generate: true,
    },
    taint: {
        color: "#590aad",
        modifier: 0,
        generate: false,
    },
    forrest: {
        color: "#008000",
        modifier: 20,
        generate: true,
    },
    snow: {
        color: "#e1e8e2",
        modifier: 10,
        generate: true,
    },
    mountains: {
        color: "#5f615f",
        modifier: 5,
        generate: true,
    },
    plains: {
        color: "#8dd66d",
        modifier: 2.5,
        generate: true,
    },
    swamp: {
        color: "#08543d",
        modifier: 10,
        generate: true,
    },
};

export type BiomeType = keyof typeof biomes;
export type BiomeEntry = { type: BiomeType; point: Point };
