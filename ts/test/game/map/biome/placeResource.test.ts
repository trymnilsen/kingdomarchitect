import assert from "node:assert";
import { describe, it } from "node:test";
import {
    fixed,
    placeResource,
} from "../../../../src/game/map/biome/placeResource.ts";
import {
    ChunkSize,
    createLandTerrain,
} from "../../../../src/game/map/chunk.ts";
import { ChunkMapComponentId } from "../../../../src/game/component/chunkMapComponent.ts";
import { stoneResource } from "../../../../src/data/inventory/items/naturalResource.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../../testWorld.ts";

describe("placeResource", () => {
    it("places the count across the whole chunk on distinct tiles", () => {
        const { root } = createMinimalWorld();
        const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
        const chunkEntity = new Entity("chunk");
        root.addChild(chunkEntity);

        placeResource(
            fixed(40),
            stoneResource,
            { chunkX: 1, chunkY: -1, terrain: createLandTerrain() },
            chunkEntity,
            chunkMap,
        );

        assert.strictEqual(chunkEntity.children.length, 40);
        const tiles = new Set<string>();
        for (const stone of chunkEntity.children) {
            const { x, y } = stone.worldPosition;
            assert.strictEqual(Math.floor(x / ChunkSize), 1);
            assert.strictEqual(Math.floor(y / ChunkSize), -1);
            tiles.add(`${x},${y}`);
        }
        assert.strictEqual(tiles.size, 40);
    });
});
