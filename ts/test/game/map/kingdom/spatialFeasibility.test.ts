import { describe, it } from "node:test";
import assert from "node:assert";
import { checkSpatialFeasibility } from "../../../../src/game/map/kingdom/spatialFeasibility.ts";
import { KingdomSpawnConfig } from "../../../../src/game/map/kingdom/kingdomSpawnConfig.ts";
import { KingdomSpawnTestHarness } from "./kingdomSpawnTestHarness.ts";

describe("spatialFeasibility", () => {
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
