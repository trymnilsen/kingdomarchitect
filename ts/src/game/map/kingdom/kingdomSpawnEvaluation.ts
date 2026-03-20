import type { Point } from "../../../common/point.ts";
import { Entity } from "../../entity/entity.ts";
import type { Volume } from "../volume.ts";
import { computeInfluenceAtChunk } from "./influenceScan.ts";
import { KingdomSpawnConfig } from "./kingdomSpawnConfig.ts";
import {
    checkSpatialFeasibility,
    type SpatialFeasibilityResult,
} from "./spatialFeasibility.ts";

export type KingdomSpawnResult = {
    shouldSpawn: boolean;
    /** The raw spawn score before the random roll */
    spawnScore: number;
    /** Individual factor values for debugging/tuning */
    factors: {
        biomeWeight: number;
        progressionWeight: number;
        influenceWeight: number;
    };
    /** Present when shouldSpawn is true — the spatial check result */
    feasibility?: SpatialFeasibilityResult;
    /** Present when shouldSpawn is true — how developed this kingdom starts (0–1) */
    developmentLevel?: number;
};

/**
 * Convenience builder for rejected results. Carries the score and factors
 * so callers can inspect why a spawn was denied even when shouldSpawn is false.
 */
const noSpawn = (
    spawnScore: number,
    factors: KingdomSpawnResult["factors"],
): KingdomSpawnResult => ({
    shouldSpawn: false,
    spawnScore,
    factors,
});

/**
 * Evaluates whether a new NPC kingdom should spawn at the given volume.
 *
 * Evaluation runs in three stages:
 *
 * 1. **Hard gates** — volume properties that disqualify immediately regardless
 *    of anything else (start biome, taint biome, too small).
 *
 * 2. **Spawn score** — a multiplicative formula:
 *    `baseProbability × biomeWeight × progressionWeight × influenceWeight`
 *    A random roll must land below this score for the spawn to proceed.
 *    Returning the score even on failure lets callers tune the config.
 *
 * 3. **Spatial feasibility** — a BFS flood fill into unregistered space
 *    around the candidate to ensure the kingdom has room to grow. This is
 *    checked last because it involves traversal that is more expensive than
 *    the earlier checks.
 *
 * @param random Injectable random function — defaults to Math.random.
 *               Pass a deterministic function in tests to control rolls.
 */
export function evaluateKingdomSpawn(
    root: Entity,
    volume: Volume,
    candidateChunkPosition: Point,
    currentTick: number,
    random: () => number = Math.random,
): KingdomSpawnResult {
    const zeroFactors = {
        biomeWeight: 0,
        progressionWeight: 0,
        influenceWeight: 0,
    };

    // Gate 1: start biomes are reserved for the player — never spawn here
    if (volume.isStartBiome === true) {
        return noSpawn(0, zeroFactors);
    }

    // Gate 2: taint is a hostile magical biome, kingdoms won't settle there
    if (volume.type === "taint") {
        return noSpawn(0, zeroFactors);
    }

    // Gate 3: volume must be large enough to support a viable kingdom
    if (volume.maxSize < KingdomSpawnConfig.minimumVolumeSize) {
        return noSpawn(0, zeroFactors);
    }

    const biomeWeight =
        KingdomSpawnConfig.biomeSuitability[
            volume.type as keyof typeof KingdomSpawnConfig.biomeSuitability
        ] ?? 0;

    // A weight of zero means the biome config explicitly forbids spawning
    if (biomeWeight === 0) {
        return noSpawn(0, { ...zeroFactors, biomeWeight });
    }

    // Progression weight: logarithmic ramp from floor to ceiling over time.
    // Log scale is intentional — kingdoms should appear quickly at first and
    // then slow down, not keep accelerating linearly into the late game.
    const { floor, ceiling, scaleDivisor } = KingdomSpawnConfig.progression;
    const maxLogValue = Math.log10(1 + 20000 / scaleDivisor);
    const unclampedProgressionWeight =
        floor +
        ((ceiling - floor) * Math.log10(1 + currentTick / scaleDivisor)) /
            maxLogValue;
    const progressionWeight = Math.max(
        floor,
        Math.min(ceiling, unclampedProgressionWeight),
    );

    // Influence weight: nearby kingdoms suppress new spawns.
    // As total influence approaches suppressionThreshold the weight reaches 0,
    // preventing kingdoms from piling up in already-settled regions.
    const totalInfluence = computeInfluenceAtChunk(
        root,
        candidateChunkPosition,
    );
    const influenceWeight = Math.max(
        0,
        1.0 - totalInfluence / KingdomSpawnConfig.influence.suppressionThreshold,
    );

    const spawnScore =
        KingdomSpawnConfig.baseProbability *
        biomeWeight *
        progressionWeight *
        influenceWeight;

    const factors = { biomeWeight, progressionWeight, influenceWeight };

    // Random roll: the score is the probability threshold.
    // Higher score = more likely to spawn, but never certain.
    if (random() >= spawnScore) {
        return noSpawn(spawnScore, factors);
    }

    // Target kingdom size scales with progression so late-game kingdoms
    // are larger and more established than early ones.
    const targetChunks = Math.floor(
        (2 + progressionWeight * 6) * (0.6 + random() * 0.8),
    );

    const feasibility = checkSpatialFeasibility(
        root,
        candidateChunkPosition,
        targetChunks,
    );

    if (!feasibility.feasible) {
        return noSpawn(spawnScore, factors);
    }

    // Development level represents how advanced the kingdom starts —
    // a fully late-game spawn (progressionWeight at ceiling) starts at 1.0,
    // an early spawn (progressionWeight at floor) starts at 0.0.
    const developmentLevel = (progressionWeight - floor) / (ceiling - floor);

    return {
        shouldSpawn: true,
        spawnScore,
        factors,
        feasibility,
        developmentLevel,
    };
}
