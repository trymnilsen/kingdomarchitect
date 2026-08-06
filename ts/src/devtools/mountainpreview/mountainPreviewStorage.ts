import { log } from "../../common/logging/logger.ts";
import type { Point } from "../../common/point.ts";
import type {
    MountainPreviewState,
    PaintMode,
} from "./mountainPreviewState.ts";
import { shapePresetNames, type ShapePresetName } from "./shapePresets.ts";

const STORAGE_KEY = "mountainPreview.scenario";

/**
 * The painted scenario plus shape settings, persisted so a page reload (e.g.
 * after recompiling new generation logic) restores the same canvas and tuning
 * instead of forcing a rebuild by hand. The generated result is intentionally
 * excluded: it is derived from the generation logic under development and is
 * recomputed by pressing Start.
 */
type PersistedScenario = {
    startChunk: Point | null;
    blocked: string[];
    targetSize: number;
    mode: PaintMode;
    preset: ShapePresetName;
    seed: number;
    noiseAmplitude: number;
    encompassBias: number;
    wallOffset: number;
};

/**
 * Writes the current scenario to local storage. Failures (storage disabled or
 * full) are logged and swallowed so they never interrupt the dev tool.
 */
export function saveScenario(state: MountainPreviewState): void {
    try {
        const scenario: PersistedScenario = {
            startChunk: state.startChunk,
            blocked: [...state.blocked],
            targetSize: state.targetSize,
            mode: state.mode,
            preset: state.preset,
            seed: state.seed,
            noiseAmplitude: state.noiseAmplitude,
            encompassBias: state.encompassBias,
            wallOffset: state.wallOffset,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
    } catch (error) {
        log.error("Failed to save mountain preview scenario", { error });
    }
}

/**
 * Applies a previously saved scenario onto a freshly created state. Anything
 * missing or malformed is left at its default, so a corrupt or partial entry
 * degrades gracefully rather than throwing.
 */
export function restoreScenario(state: MountainPreviewState): void {
    const scenario = readScenario();
    if (scenario == null) {
        return;
    }

    if (scenario.startChunk === null || isPoint(scenario.startChunk)) {
        state.startChunk = scenario.startChunk;
    }
    if (Array.isArray(scenario.blocked)) {
        state.blocked = new Set(
            scenario.blocked.filter((key) => typeof key === "string"),
        );
    }
    if (Number.isFinite(scenario.targetSize)) {
        state.targetSize = scenario.targetSize;
    }
    if (scenario.mode === "start" || scenario.mode === "blocking") {
        state.mode = scenario.mode;
    }
    if (shapePresetNames.includes(scenario.preset)) {
        state.preset = scenario.preset;
    }
    if (Number.isFinite(scenario.seed)) {
        state.seed = scenario.seed;
    }
    if (Number.isFinite(scenario.noiseAmplitude)) {
        state.noiseAmplitude = scenario.noiseAmplitude;
    }
    if (Number.isFinite(scenario.encompassBias)) {
        state.encompassBias = scenario.encompassBias;
    }
    if (Number.isFinite(scenario.wallOffset)) {
        state.wallOffset = scenario.wallOffset;
    }
}

function readScenario(): PersistedScenario | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) {
            return null;
        }
        return JSON.parse(raw) as PersistedScenario;
    } catch (error) {
        log.error("Failed to read mountain preview scenario", { error });
        return null;
    }
}

function isPoint(value: unknown): value is Point {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as Point).x === "number" &&
        typeof (value as Point).y === "number"
    );
}
