import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../../src/common/point.ts";
import { SparseSet } from "../../../../src/common/structure/sparseSet.ts";
import {
    ChunkMapComponentId,
    createChunkMapComponent,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { ChunkSize } from "../../../../src/game/map/chunk.ts";
import { createBuildingPlacementValidator } from "../../../../src/game/map/query/buildingPlacementValidator.ts";
import { findClosestAvailablePosition } from "../../../../src/game/map/query/closestPositionQuery.ts";
import { woodenHouse } from "../../../../src/data/building/wood/house.ts";

/**
 * Creates a root entity with tile and chunk-map components.
 * The TileComponent registers a chunk for every unique 8×8 chunk that contains
 * at least one of the listed positions — giving the whole chunk valid ground.
 */
function createWorld(tiledPositions: Point[]): Entity {
    const root = new Entity("root");
    const tileComponent = createTileComponent();
    const chunkMapComponent = createChunkMapComponent();

    const seenChunks = new Set<string>();
    for (const pos of tiledPositions) {
        const chunkX = Math.floor(pos.x / ChunkSize);
        const chunkY = Math.floor(pos.y / ChunkSize);
        const chunkKey = `${chunkX},${chunkY}`;
        if (!seenChunks.has(chunkKey)) {
            seenChunks.add(chunkKey);
            setChunk(tileComponent, { chunkX, chunkY });
        }
    }

    root.setEcsComponent(tileComponent);
    root.setEcsComponent(chunkMapComponent);
    return root;
}

/**
 * Registers a completed building entity in root's chunk map at the given
 * world position so that queryEntity can find it.
 */
function addBuilding(root: Entity, pos: Point): Entity {
    const building = new Entity(`building-${pos.x}-${pos.y}`);
    building.setEcsComponent(createBuildingComponent(woodenHouse, false));
    building.worldPosition = pos;

    const chunkMapComponent = root.requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;
    const chunkX = Math.floor(pos.x / ChunkSize);
    const chunkY = Math.floor(pos.y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    if (!chunkMap.chunks.has(chunkKey)) {
        chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
    }
    chunkMap.chunks.get(chunkKey)!.add(building);

    return building;
}

describe("createBuildingPlacementValidator", () => {
    describe("candidate tile validity", () => {
        it("rejects a candidate that falls in an unregistered chunk (no ground)", () => {
            // Tiles only exist in chunk (0,0) — positions 0-7 on both axes.
            // The candidate lives in chunk (2,2), which has never been registered.
            const world = createWorld([{ x: 4, y: 4 }]);
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 20, y: 20 }), false);
        });

        it("rejects a candidate already occupied by a building", () => {
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 3, y: 4 },
                { x: 5, y: 4 },
                { x: 4, y: 3 },
                { x: 4, y: 5 },
            ]);
            addBuilding(world, { x: 4, y: 4 });
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), false);
        });
    });

    describe("reachability of the new building", () => {
        it("rejects a candidate whose every cardinal neighbour is occupied by a building", () => {
            // (4,4) is the candidate; all four cardinal neighbours have buildings.
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 3, y: 4 },
                { x: 5, y: 4 },
                { x: 4, y: 3 },
                { x: 4, y: 5 },
            ]);
            addBuilding(world, { x: 3, y: 4 });
            addBuilding(world, { x: 5, y: 4 });
            addBuilding(world, { x: 4, y: 3 });
            addBuilding(world, { x: 4, y: 5 });
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), false);
        });

        it("accepts a candidate when at least one cardinal neighbour is free", () => {
            // Three neighbours are blocked; (4,5) is a clear tiled tile.
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 3, y: 4 },
                { x: 5, y: 4 },
                { x: 4, y: 3 },
                { x: 4, y: 5 },
            ]);
            addBuilding(world, { x: 3, y: 4 });
            addBuilding(world, { x: 5, y: 4 });
            addBuilding(world, { x: 4, y: 3 });
            // (4,5) deliberately left free
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), true);
        });
    });

    describe("protecting existing adjacent buildings", () => {
        it("rejects a candidate that would be the last free exit of an adjacent building", () => {
            // Building B sits at (4,3).
            // Its three other cardinal exits are all blocked by buildings:
            //   (3,3) → building, (5,3) → building, (4,2) → building.
            // Only (4,4) — the candidate — remains free for B.
            // Placing here would seal B in.
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 4, y: 3 },
                { x: 3, y: 3 },
                { x: 5, y: 3 },
                { x: 4, y: 2 },
            ]);
            addBuilding(world, { x: 4, y: 3 }); // B
            addBuilding(world, { x: 3, y: 3 });
            addBuilding(world, { x: 5, y: 3 });
            addBuilding(world, { x: 4, y: 2 });
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), false);
        });

        it("accepts a candidate next to a building that still has other free exits", () => {
            // Building B at (4,3). Only (3,3) is blocked; (5,3) and (4,2) remain free.
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 4, y: 3 },
                { x: 3, y: 3 },
                { x: 5, y: 3 },
                { x: 4, y: 2 },
            ]);
            addBuilding(world, { x: 4, y: 3 }); // B
            addBuilding(world, { x: 3, y: 3 });
            // (5,3) and (4,2) are free ground — B still has two exits after placement
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), true);
        });

        it("accepts placement when there are no adjacent buildings at all", () => {
            const world = createWorld([
                { x: 4, y: 4 },
                { x: 3, y: 4 },
                { x: 5, y: 4 },
                { x: 4, y: 3 },
                { x: 4, y: 5 },
            ]);
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 4, y: 4 }), true);
        });
    });

    describe("findClosestAvailablePosition integration", () => {
        it("skips a position that would block an adjacent building and finds the next valid one", () => {
            // Layout (y increases downward):
            //
            //   (3,3)B  (4,3)B  (5,3)B   ← three buildings; B at (4,3) has no other exits
            //           (4,4)C           ← C would seal B in → rejected
            //   (3,5)   (4,5)V  (5,5)   ← V is the first valid candidate
            //           (4,6)
            //
            // Building B at (4,3):
            //   left  (3,3) → building
            //   right (5,3) → building
            //   up    (4,2) → building
            //   down  (4,4) → candidate (only free exit) → placing here blocks B
            //
            // (4,5) has free exits at (3,5), (5,5), (4,6) and doesn't seal any building.
            const world = createWorld([
                { x: 4, y: 2 },
                { x: 3, y: 3 },
                { x: 4, y: 3 },
                { x: 5, y: 3 },
                { x: 4, y: 4 },
                { x: 3, y: 5 },
                { x: 4, y: 5 },
                { x: 5, y: 5 },
                { x: 4, y: 6 },
            ]);
            addBuilding(world, { x: 4, y: 2 });
            addBuilding(world, { x: 3, y: 3 });
            addBuilding(world, { x: 4, y: 3 }); // B
            addBuilding(world, { x: 5, y: 3 });

            const validator = createBuildingPlacementValidator(world);
            const result = findClosestAvailablePosition(
                world,
                { x: 4, y: 4 },
                validator,
            );

            assert.ok(result, "Should find a valid position");
            assert.notDeepStrictEqual(
                result,
                { x: 4, y: 4 },
                "Should not pick the position that blocks building B",
            );
        });
    });
});
