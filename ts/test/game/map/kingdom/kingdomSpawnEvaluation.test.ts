import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluateKingdomSpawn } from "../../../../src/game/map/kingdom/kingdomSpawnEvaluation.ts";
import { KingdomSpawnConfig } from "../../../../src/game/map/kingdom/kingdomSpawnConfig.ts";
import { KingdomType } from "../../../../src/game/component/kingdomComponent.ts";
import { KingdomSpawnTestHarness } from "./kingdomSpawnTestHarness.ts";
import type { Volume } from "../../../../src/game/map/volume.ts";

const alwaysPass = () => 0;

function makePlains(h: KingdomSpawnTestHarness, maxSize = 12): Volume {
    return h.createVolume("plains", maxSize);
}

describe("evaluateKingdomSpawn", () => {
    it("rejects taint biome volumes", () => {
        const h = new KingdomSpawnTestHarness();
        const candidate = { x: 5, y: 5 };
        h.buildChunkGrid(3, 3, 8, 8);
        const volume = h.createVolume("taint", 16);

        const result = evaluateKingdomSpawn(
            h.root,
            volume,
            candidate,
            10000,
            alwaysPass,
        );

        assert.strictEqual(result.shouldSpawn, false);
    });

    it("nearby kingdoms suppress spawn score via influence", () => {
        const candidate = { x: 10, y: 10 };
        const h = new KingdomSpawnTestHarness();

        // Candidate chunk with its own volume
        const vCandidate = h.createVolume("plains", 16);
        h.addChunk(candidate.x, candidate.y, vCandidate);

        // Each kingdom sits in its own volume, directly adjacent to the candidate.
        // Separate volumes are required so the BFS treats each adjacency as a
        // volume boundary crossing and applies the decay that drives suppression.
        const leftKingdomVolume = h.createVolume("plains", 4);
        h.addChunk(9, 10, leftKingdomVolume);
        const rightKingdomVolume = h.createVolume("plains", 4);
        h.addChunk(11, 10, rightKingdomVolume);
        const aboveKingdomVolume = h.createVolume("plains", 4);
        h.addChunk(10, 9, aboveKingdomVolume);

        // Place several player kingdoms near the candidate to saturate influence
        h.placeKingdom({ x: 9, y: 10 }, KingdomType.Player);
        h.placeKingdom({ x: 11, y: 10 }, KingdomType.Player);
        h.placeKingdom({ x: 10, y: 9 }, KingdomType.Player);

        const result = evaluateKingdomSpawn(
            h.root,
            vCandidate,
            candidate,
            10000,
            alwaysPass,
        );

        assert.strictEqual(result.shouldSpawn, false);
        assert.ok(
            result.factors.influenceWeight === 0 || result.spawnScore === 0,
            `influence should suppress the spawn (influenceWeight=${result.factors.influenceWeight}, spawnScore=${result.spawnScore})`,
        );
    });

    it("spatial infeasibility blocks spawn even when score passes", () => {
        const candidate = { x: 10, y: 10 };
        const h = new KingdomSpawnTestHarness();
        // Candidate registered, all 4 adjacent positions also registered (no room)
        h.addChunk(candidate.x, candidate.y);
        h.addChunk(candidate.x - 1, candidate.y);
        h.addChunk(candidate.x + 1, candidate.y);
        h.addChunk(candidate.x, candidate.y - 1);
        h.addChunk(candidate.x, candidate.y + 1);

        const volume = makePlains(h, 16);
        const result = evaluateKingdomSpawn(
            h.root,
            volume,
            candidate,
            10000,
            () => 0.001,
        );

        assert.strictEqual(result.shouldSpawn, false);
        assert.ok(
            result.spawnScore > 0,
            `spawnScore (${result.spawnScore}) should be positive, so feasibility blocked the spawn, not the score`,
        );
    });

    it("development level is higher for later game spawns than earlier ones", () => {
        const candidate = { x: 10, y: 10 };

        const spawn = (tick: number) => {
            const h = new KingdomSpawnTestHarness();
            h.addChunk(candidate.x, candidate.y);
            const volume = makePlains(h, 16);
            return evaluateKingdomSpawn(
                h.root,
                volume,
                candidate,
                tick,
                () => 0.001,
            );
        };

        const early = spawn(100);
        const late = spawn(10000);

        assert.strictEqual(early.shouldSpawn, true);
        assert.strictEqual(late.shouldSpawn, true);
        assert.ok(
            late.developmentLevel! >= early.developmentLevel!,
            `late developmentLevel (${late.developmentLevel}) should be >= early developmentLevel (${early.developmentLevel})`,
        );
    });

    it("each gate condition is checked independently", () => {
        const candidate = { x: 5, y: 5 };

        // Start biome + large maxSize: size should not override start biome gate
        const hStart = new KingdomSpawnTestHarness();
        hStart.buildChunkGrid(3, 3, 8, 8);
        const startVolume = hStart.createVolume("plains", 32, true);
        const startResult = evaluateKingdomSpawn(
            hStart.root,
            startVolume,
            candidate,
            10000,
            alwaysPass,
        );
        assert.strictEqual(
            startResult.shouldSpawn,
            false,
            "start biome should be rejected even with large maxSize",
        );

        // Good biome + small maxSize: biome suitability should not override size gate
        const hSmall = new KingdomSpawnTestHarness();
        hSmall.buildChunkGrid(3, 3, 8, 8);
        const smallVolume = hSmall.createVolume(
            "plains",
            KingdomSpawnConfig.minimumVolumeSize - 1,
        );
        const smallResult = evaluateKingdomSpawn(
            hSmall.root,
            smallVolume,
            candidate,
            10000,
            alwaysPass,
        );
        assert.strictEqual(
            smallResult.shouldSpawn,
            false,
            "plains biome should be rejected when maxSize is below minimum",
        );
    });
});
