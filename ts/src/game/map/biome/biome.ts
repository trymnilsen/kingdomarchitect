import { Point } from "../../../common/point.js";

export const biomes = {
    desert: {
        color: "#f2d357",
        tint: "#9c8736",
        modifier: 5,
        generate: true,
    },
    taint: {
        color: "#590aad",
        tint: "#3b0c6e",
        modifier: 0,
        generate: false,
    },
    forrest: {
        color: "#008000",
        tint: "#084f08",
        modifier: 20,
        generate: true,
    },
    snow: {
        color: "#e1e8e2",
        tint: "#b0b3b8",
        modifier: 10,
        generate: true,
    },
    mountains: {
        color: "#5f615f",
        tint: "#383838",
        modifier: 5,
        generate: true,
    },
    plains: {
        color: "#8dd66d",
        tint: "#5c8a48",
        modifier: 2.5,
        generate: true,
    },
    swamp: {
        color: "#08543d",
        tint: "#14362c",
        modifier: 10,
        generate: true,
    },
} as const;

export type BiomeType = keyof typeof biomes;
export type BiomeEntry = {
    type: BiomeType;
    point: Point;
};
