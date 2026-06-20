import type { Point } from "../common/point.ts";
import { shapePresets, type ShapePresetName } from "./shapePresets.ts";

/**
 * Which kind of marker a grid click paints. The start chunk is a single guide
 * (a cursor for "the biome begins here"); blocking chunks are toggled freely.
 */
export type PaintMode = "start" | "blocking";

export type MountainPreviewState = {
    /** The yellow start guide. There can only ever be one; null until placed. */
    startChunk: Point | null;
    /** Blocking chunk keys (see chunkKey) that the search cannot expand into. */
    blocked: Set<string>;
    /** Result of the most recent search: the chunks making up the biome. */
    generated: Point[];
    /** The active paint tool for grid clicks. */
    mode: PaintMode;
    /** Desired biome size in chunks; adjustable from the UI. */
    targetSize: number;
    /** The selected silhouette preset. */
    preset: ShapePresetName;
    /** Noise field seed; reshuffled to vary a shape without changing its kind. */
    seed: number;
    /** Live noise amount, seeded from the preset but tunable from the UI. */
    noiseAmplitude: number;
    /** How strongly growth avoids wrapping around blocked chunks. */
    encompassBias: number;
    /** Shifts the shape's centre off the start, away from nearby blockers. */
    wallOffset: number;
};

export const defaultTargetSize = 24;
export const minTargetSize = 1;
export const maxTargetSize = 256;

export const minNoiseAmplitude = 0;
export const maxNoiseAmplitude = 20;
export const noiseAmplitudeStep = 0.5;

export const minEncompassBias = 0;
export const maxEncompassBias = 50;
export const encompassBiasStep = 1;
const defaultEncompassBias = 8;

export const minWallOffset = 0;
export const maxWallOffset = 1.5;
export const wallOffsetStep = 0.1;
const defaultWallOffset = 0.5;

const defaultPreset: ShapePresetName = "round";
const defaultSeed = 1;

export function createInitialState(): MountainPreviewState {
    return {
        startChunk: { x: 0, y: 0 },
        blocked: new Set<string>(),
        generated: [],
        mode: "blocking",
        targetSize: defaultTargetSize,
        preset: defaultPreset,
        seed: defaultSeed,
        noiseAmplitude: shapePresets[defaultPreset].noiseAmplitude,
        encompassBias: defaultEncompassBias,
        wallOffset: defaultWallOffset,
    };
}
