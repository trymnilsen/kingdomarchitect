import { describe, it } from "node:test";
import assert from "node:assert";
import { checkSpatialFeasibility } from "../../../../src/game/map/kingdom/spatialFeasibility.ts";
import { KingdomSpawnConfig } from "../../../../src/game/map/kingdom/kingdomSpawnConfig.ts";
import { KingdomSpawnTestHarness } from "./kingdomSpawnTestHarness.ts";

describe("spatialFeasibility", () => {
    it("reports feasible when surrounded by unregistered space", () => {
        const h = new KingdomSpawnTestHarness();
        const candidate = { x: 10, y: 10 };
        // Register only the candidate chunk itself
        h.addChunk(candidate.x, candidate.y);
        const targetChunks = KingdomSpawnConfig.minimumVolumeSize + 2;

        const result = checkSpatialFeasibility(h.root, candidate, targetChunks);

        assert.strictEqual(result.feasible, true);
        assert.ok(
            result.availableChunks >= targetChunks,
            `availableChunks (${result.availableChunks}) should be >= targetChunks (${targetChunks})`,
        );
    });

    it("reports not feasible when fully enclosed by registered chunks", () => {
        const h = new KingdomSpawnTestHarness();
        const candidate = { x: 10, y: 10 };
        // Register candidate and all 4 adjacent positions
        h.addChunk(candidate.x, candidate.y);
        h.addChunk(candidate.x - 1, candidate.y);
        h.addChunk(candidate.x + 1, candidate.y);
        h.addChunk(candidate.x, candidate.y - 1);
        h.addChunk(candidate.x, candidate.y + 1);

        const result = checkSpatialFeasibility(
            h.root,
            candidate,
            KingdomSpawnConfig.minimumVolumeSize,
        );

        assert.strictEqual(result.feasible, false);
        assert.ok(
            result.availableChunks < KingdomSpawnConfig.minimumVolumeSize,
            `availableChunks (${result.availableChunks}) should be below minimum`,
        );
    });

    it("available chunk count is reduced when some directions are blocked", () => {
        const candidate = { x: 5, y: 5 };
        const targetChunks = 20;

        // Fully open: only candidate registered — BFS finds targetChunks unregistered.
        const hOpen = new KingdomSpawnTestHarness();
        hOpen.addChunk(candidate.x, candidate.y);
        const openResult = checkSpatialFeasibility(
            hOpen.root,
            candidate,
            targetChunks,
        );

        // Tightly enclosed: candidate + 3 walls + one-chunk corridor sealed by a wall.
        // Available space = exactly 1 chunk (the single open adjacent position before a wall).
        const hBlocked = new KingdomSpawnTestHarness();
        hBlocked.addChunk(candidate.x, candidate.y);
        // Block left, above, below
        hBlocked.addChunk(candidate.x - 1, candidate.y);
        hBlocked.addChunk(candidate.x, candidate.y - 1);
        hBlocked.addChunk(candidate.x, candidate.y + 1);
        // Only right is open: (6,5) is unregistered, but seal it off at (7,5)
        hBlocked.addChunk(candidate.x + 2, candidate.y);
        // Also seal up/down from the single open slot to bound the space
        hBlocked.addChunk(candidate.x + 1, candidate.y - 1);
        hBlocked.addChunk(candidate.x + 1, candidate.y + 1);
        // Available: only (6,5) = 1 chunk
        const blockedResult = checkSpatialFeasibility(
            hBlocked.root,
            candidate,
            targetChunks,
        );

        assert.ok(
            blockedResult.availableChunks < openResult.availableChunks,
            `partially blocked (${blockedResult.availableChunks}) should have fewer available chunks than fully open (${openResult.availableChunks})`,
        );
    });

    it("flood fill follows narrow corridors of unregistered space", () => {
        const h = new KingdomSpawnTestHarness();
        const candidate = { x: 10, y: 10 };
        h.addChunk(candidate.x, candidate.y);

        // Build walls above and below, leaving only a narrow horizontal corridor
        // registered walls: y=9 row and y=11 row, extensive
        h.buildChunkLine(6, 9, 12, "horizontal"); // wall above
        h.buildChunkLine(6, 11, 12, "horizontal"); // wall below
        // Also block left side
        h.addChunk(candidate.x - 1, candidate.y);

        // Only open direction is right (x > 10, y = 10)
        const targetChunks = 4;
        const result = checkSpatialFeasibility(h.root, candidate, targetChunks);

        assert.ok(
            result.availableChunks > 0,
            "flood fill should find chunks along the unregistered corridor",
        );
    });

    it("feasibility uses configured minimum volume size as threshold", () => {
        const minimum = KingdomSpawnConfig.minimumVolumeSize;
        const candidate = { x: 10, y: 10 };

        // Setup where available < minimum: fully enclosed scenario
        const hTight = new KingdomSpawnTestHarness();
        hTight.addChunk(candidate.x, candidate.y);
        // Block all 4 directions
        hTight.addChunk(candidate.x - 1, candidate.y);
        hTight.addChunk(candidate.x + 1, candidate.y);
        hTight.addChunk(candidate.x, candidate.y - 1);
        hTight.addChunk(candidate.x, candidate.y + 1);

        const tightResult = checkSpatialFeasibility(
            hTight.root,
            candidate,
            minimum + 4,
        );
        assert.strictEqual(
            tightResult.feasible,
            false,
            "should not be feasible when availableChunks < minimum",
        );

        // Setup where available >= minimum: open on all sides
        const hOpen = new KingdomSpawnTestHarness();
        hOpen.addChunk(candidate.x, candidate.y);

        const openResult = checkSpatialFeasibility(
            hOpen.root,
            candidate,
            minimum + 4,
        );
        assert.strictEqual(
            openResult.feasible,
            true,
            "should be feasible when availableChunks >= minimum",
        );
    });
});
