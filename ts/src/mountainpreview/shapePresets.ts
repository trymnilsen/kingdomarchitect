import type { Point } from "../common/point.ts";
import type { BiomeShapeParams } from "./biomeShapeSearch.ts";

export type ShapePresetName = "round" | "square" | "long" | "blobby" | "peanut";

/**
 * The tuning subset of {@link BiomeShapeParams}. Start chunk, blocked set,
 * target size and seed are scenario state and supplied separately at search
 * time; a preset only describes the silhouette.
 */
export type ShapePresetParams = Pick<
    BiomeShapeParams,
    "metric" | "anisotropy" | "orientation" | "noiseAmplitude" | "noiseFrequency"
> & {
    /** Peanut/lobed shapes: a second attractor placed at start + this offset. */
    wellOffset?: Point;
};

export const shapePresetNames: ShapePresetName[] = [
    "round",
    "square",
    "long",
    "blobby",
    "peanut",
];

/**
 * Named silhouettes the dev tool can pick between. Noise amplitudes are scaled
 * relative to the metric distances they perturb: a couple of chunks of wobble
 * reads as a rough edge, while larger values dissolve the base shape into lobes.
 */
export const shapePresets: Record<ShapePresetName, ShapePresetParams> = {
    round: {
        metric: "euclidean",
        anisotropy: 1,
        orientation: "horizontal",
        noiseAmplitude: 1.5,
        noiseFrequency: 0.25,
    },
    square: {
        metric: "chebyshev",
        anisotropy: 1,
        orientation: "horizontal",
        noiseAmplitude: 1,
        noiseFrequency: 0.25,
    },
    long: {
        metric: "euclidean",
        anisotropy: 3,
        orientation: "horizontal",
        noiseAmplitude: 2,
        noiseFrequency: 0.3,
    },
    blobby: {
        metric: "euclidean",
        anisotropy: 1,
        orientation: "horizontal",
        noiseAmplitude: 6,
        noiseFrequency: 0.35,
    },
    peanut: {
        metric: "euclidean",
        anisotropy: 1,
        orientation: "horizontal",
        noiseAmplitude: 3,
        noiseFrequency: 0.3,
        wellOffset: { x: 5, y: 0 },
    },
};
