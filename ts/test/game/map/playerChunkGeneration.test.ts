import assert from "node:assert";
import { describe, it } from "node:test";
import { addInitialPlayerChunk } from "../../../src/game/map/player.ts";
import { getChunk } from "../../../src/game/component/tileComponent.ts";
import { TileComponentId } from "../../../src/game/component/tileComponent.ts";
import { PlayerUnitComponentId } from "../../../src/game/component/playerUnitComponent.ts";
import { KingdomComponentId } from "../../../src/game/component/kingdomComponent.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../worldInvariants.ts";

/**
 * addInitialPlayerChunk builds the starting chunk with the player kingdom,
 * first worker, buildings, and scattered resources. The layout is partly
 * random, so these tests pin the structural invariants of the result
 * rather than exact positions.
 */
describe("addInitialPlayerChunk", () => {
    it("registers the start chunk as the start biome", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        const tiles = root.requireEcsComponent(TileComponentId);
        const startChunk = getChunk(tiles, { x: 0, y: 0 });
        assert.ok(startChunk, "chunk (0,0) should be registered");
        assert.strictEqual(startChunk.volume?.isStartBiome, true);
    });

    it("keeps transforms consistent across the generated entity tree", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        assertTransformsConsistent(root);
    });

    it("indexes the generated entities in the chunk map", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        assertChunkMapMatchesTree(root);
    });

    it("places the first worker at the returned spawn position, under the kingdom", () => {
        const { root } = createMinimalWorld();

        const workerPosition = addInitialPlayerChunk(root);

        const units = root.queryComponents(PlayerUnitComponentId);
        assert.strictEqual(units.size, 1, "should spawn exactly one worker");
        const worker = [...units.keys()][0];
        assert.deepStrictEqual(worker.worldPosition, workerPosition);
        assert.ok(
            worker.parent?.hasComponent(KingdomComponentId),
            "the worker should be parented to the player kingdom",
        );
    });
});
