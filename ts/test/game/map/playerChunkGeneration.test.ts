import assert from "node:assert";
import { describe, it } from "node:test";
import { addInitialPlayerChunk } from "../../../src/game/map/player.ts";
import { PlayerUnitComponentId } from "../../../src/game/component/playerUnitComponent.ts";
import { KingdomComponentId } from "../../../src/game/component/kingdomComponent.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { assertChunkMapMatchesTree } from "../worldInvariants.ts";

/**
 * addInitialPlayerChunk builds the starting chunk with the player kingdom,
 * first worker, buildings, and scattered resources. The layout is partly
 * random, so these tests pin the structural invariants of the result
 * rather than exact positions.
 */
describe("addInitialPlayerChunk", () => {
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
