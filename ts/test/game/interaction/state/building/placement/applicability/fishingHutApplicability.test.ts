import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../../../../src/common/point.ts";
import {
    createTileComponent,
    setChunk,
    TileComponentId,
} from "../../../../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../../../../src/game/entity/entity.ts";
import { fishingHutApplicability } from "../../../../../../../src/game/interaction/state/building/placement/applicability/fishingHutApplicability.ts";
import {
    ChunkSize,
    createLandTerrain,
    terrainIndex,
} from "../../../../../../../src/game/map/chunk.ts";
import { Terrain } from "../../../../../../../src/game/map/terrain.ts";

const chunkX = 2;
const chunkY = 1;
const candidate: Point = {
    x: chunkX * ChunkSize + 4,
    y: chunkY * ChunkSize + 3,
};

function createWorldWithLandAt(landTiles: Point[]): Entity {
    const terrain = createLandTerrain().fill(Terrain.Water);
    for (const tile of landTiles) {
        terrain[terrainIndex(tile.x, tile.y)] = Terrain.Land;
    }
    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX, chunkY, terrain });
    const root = new Entity("root");
    root.setEcsComponent(tileComponent);
    return root;
}

describe("fishingHutApplicability", () => {
    it("accepts a water tile with land on one side", () => {
        const world = createWorldWithLandAt([{ x: 4, y: 4 }]);

        assert.strictEqual(
            fishingHutApplicability(candidate, world).isApplicable,
            true,
        );
    });

    it("rejects a land tile even with land beside it", () => {
        const world = createWorldWithLandAt([
            { x: 4, y: 3 },
            { x: 4, y: 4 },
        ]);

        const result = fishingHutApplicability(candidate, world);

        assert.strictEqual(result.isApplicable, false);
        assert.ok(!result.isApplicable && result.reason.includes("water"));
    });

    it("rejects open water with no land beside it", () => {
        const world = createWorldWithLandAt([
            { x: 5, y: 4 },
            { x: 4, y: 5 },
        ]);

        const result = fishingHutApplicability(candidate, world);

        assert.strictEqual(result.isApplicable, false);
    });

    it("does not count ice as shore", () => {
        const terrain = createLandTerrain().fill(Terrain.Water);
        terrain[terrainIndex(4, 4)] = Terrain.Ice;
        const tileComponent = createTileComponent();
        setChunk(tileComponent, { chunkX, chunkY, terrain });
        const root = new Entity("root");
        root.setEcsComponent(tileComponent);

        assert.strictEqual(
            fishingHutApplicability(candidate, root).isApplicable,
            false,
        );
    });

    it("counts land in a neighbouring chunk when the hut is on the chunk edge", () => {
        const edge: Point = {
            x: chunkX * ChunkSize,
            y: chunkY * ChunkSize + 3,
        };
        const world = createWorldWithLandAt([]);
        setChunk(world.requireEcsComponent(TileComponentId), {
            chunkX: chunkX - 1,
            chunkY,
            terrain: createLandTerrain(),
        });

        assert.strictEqual(
            fishingHutApplicability(edge, world).isApplicable,
            true,
        );
    });
});
