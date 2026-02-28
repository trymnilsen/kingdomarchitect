import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../../src/common/point.ts";
import { SparseSet } from "../../../../src/common/structure/sparseSet.ts";
import {
    ChunkMapComponentId,
    createChunkMapComponent,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { createBehaviorAgentComponent } from "../../../../src/game/component/BehaviorAgentComponent.ts";
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

/**
 * Registers an agent entity in root's chunk map at the given world position.
 */
function addAgent(root: Entity, pos: Point): Entity {
    const agent = new Entity(`agent-${pos.x}-${pos.y}`);
    agent.setEcsComponent(createBehaviorAgentComponent());
    agent.worldPosition = pos;

    const chunkMapComponent = root.requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;
    const chunkX = Math.floor(pos.x / ChunkSize);
    const chunkY = Math.floor(pos.y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    if (!chunkMap.chunks.has(chunkKey)) {
        chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
    }
    chunkMap.chunks.get(chunkKey)!.add(agent);

    return agent;
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

    describe("protecting adjacent agents", () => {
        it("rejects a candidate that would be the last free exit of an adjacent agent", () => {
            // Agent A sits at (6,5).
            // Its three other cardinal exits are blocked by buildings:
            //   (5,5) → building, (7,5) → building, (6,4) → building.
            // Only (6,6) — the candidate — remains free for A.
            // Placing here would trap A.
            const world = createWorld([
                { x: 6, y: 6 },
                { x: 6, y: 5 },
                { x: 5, y: 5 },
                { x: 7, y: 5 },
                { x: 6, y: 4 },
                { x: 6, y: 7 },
            ]);
            addAgent(world, { x: 6, y: 5 }); // A
            addBuilding(world, { x: 5, y: 5 });
            addBuilding(world, { x: 7, y: 5 });
            addBuilding(world, { x: 6, y: 4 });
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 6, y: 6 }), false);
        });

        it("accepts a candidate next to an agent that still has other free exits", () => {
            // Agent A at (6,5). Only (5,5) is blocked; (7,5) and (6,4) remain free.
            const world = createWorld([
                { x: 6, y: 6 },
                { x: 6, y: 5 },
                { x: 5, y: 5 },
                { x: 7, y: 5 },
                { x: 6, y: 4 },
            ]);
            addAgent(world, { x: 6, y: 5 }); // A
            addBuilding(world, { x: 5, y: 5 });
            // (7,5) and (6,4) are free ground — A still has two exits
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 6, y: 6 }), true);
        });

        it("accepts placement when there are no adjacent agents", () => {
            const world = createWorld([
                { x: 6, y: 6 },
                { x: 5, y: 6 },
                { x: 7, y: 6 },
                { x: 6, y: 5 },
                { x: 6, y: 7 },
            ]);
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 6, y: 6 }), true);
        });
    });

    describe("sole-access tile conflicts between working buildings", () => {
        it("rejects placement when two adjacent buildings would share their only free tile", () => {
            // Two buildings (B1, B2) are both adjacent to the candidate.
            // After placement their only remaining free exit is the same tile T.
            // Two workers cannot stand on the same tile, so this is invalid.
            //
            //   [bl] [B1] [bl]
            //   [T ] [  ] [B2] [bl]
            //        [bl]
            //
            // Candidate at (5,4). B1 at (4,4), B2 at (5,3). T at (4,3).
            // Blockers seal all exits except T for each building.
            const world = createWorld([
                { x: 5, y: 4 }, // candidate
                { x: 4, y: 4 }, // B1
                { x: 5, y: 3 }, // B2
                { x: 4, y: 3 }, // T (shared sole tile)
            ]);
            addBuilding(world, { x: 4, y: 4 }); // B1
            addBuilding(world, { x: 5, y: 3 }); // B2
            addBuilding(world, { x: 3, y: 4 }); // blocks B1's west exit
            addBuilding(world, { x: 4, y: 5 }); // blocks B1's south exit
            addBuilding(world, { x: 6, y: 3 }); // blocks B2's east exit
            addBuilding(world, { x: 5, y: 2 }); // blocks B2's north exit
            const validator = createBuildingPlacementValidator(world);

            // After placing at (5,4): B1 sole exit = (4,3), B2 sole exit = (4,3) → conflict
            assert.strictEqual(validator({ x: 5, y: 4 }), false);
        });

        it("rejects placement when an affected building gains the same sole tile as a non-adjacent building", () => {
            // B1 is adjacent to candidate; after placement its only free exit
            // becomes T=(4,3). B2 is not adjacent to candidate but is already
            // constrained to sole tile T=(4,3). The placement creates a conflict.
            //
            //   [bl] [B2] [bl]
            //   [bl] [T ] [bl]   <- T is the only exit for both buildings
            //   [bl] [B1] [  ]
            //        [ C]        <- candidate
            //
            // Candidate at (5,4), B1 at (4,4), B2 at (4,2), T at (4,3).
            const world = createWorld([
                { x: 5, y: 4 }, // candidate
                { x: 4, y: 4 }, // B1
                { x: 4, y: 3 }, // T
                { x: 4, y: 2 }, // B2
            ]);
            addBuilding(world, { x: 4, y: 4 }); // B1
            addBuilding(world, { x: 3, y: 4 }); // blocks B1's west exit
            addBuilding(world, { x: 4, y: 5 }); // blocks B1's south exit
            addBuilding(world, { x: 4, y: 2 }); // B2
            addBuilding(world, { x: 3, y: 2 }); // blocks B2's west exit
            addBuilding(world, { x: 5, y: 2 }); // blocks B2's east exit
            addBuilding(world, { x: 4, y: 1 }); // blocks B2's north exit
            const validator = createBuildingPlacementValidator(world);

            // After placing candidate: B1 sole exit = T, B2 already has sole exit = T → conflict
            assert.strictEqual(validator({ x: 5, y: 4 }), false);
        });

        it("rejects placement when the new building's sole tile is already depended on by another building", () => {
            // The candidate is surrounded on three sides by buildings, so the new
            // building would have exactly one free tile T=(6,4). An existing
            // building B at (6,5) is also constrained to sole tile T. Conflict.
            //
            //   [bl] [  ] [bl]
            //   [bl] [C ] [T ] [bl]
            //        [bl] [B ]
            //             [bl]
            //
            // Candidate at (5,4). T=(6,4). B at (6,5).
            const world = createWorld([
                { x: 5, y: 4 }, // candidate
                { x: 6, y: 4 }, // T (sole exit for new building and for B)
                { x: 6, y: 5 }, // B
            ]);
            addBuilding(world, { x: 4, y: 4 }); // blocks candidate's west exit
            addBuilding(world, { x: 5, y: 3 }); // blocks candidate's north exit
            addBuilding(world, { x: 5, y: 5 }); // blocks candidate's south exit (also B's west exit)
            addBuilding(world, { x: 6, y: 5 }); // B
            addBuilding(world, { x: 7, y: 5 }); // blocks B's east exit
            addBuilding(world, { x: 6, y: 6 }); // blocks B's south exit
            const validator = createBuildingPlacementValidator(world);

            // New building sole exit = T, B's sole exit = T → conflict
            assert.strictEqual(validator({ x: 5, y: 4 }), false);
        });

        it("accepts placement when two buildings share a tile but each retains multiple free exits", () => {
            // B1 and B2 both have T=(4,3) as one of their exits, but each also
            // has other free exits after placement. No sole-access conflict.
            //
            // Candidate at (5,4), B1 at (4,4), B2 at (5,3).
            // After placing candidate: B1 exits = (3,4),(4,3),(4,5); B2 exits = (4,3),(6,3),(5,2).
            const world = createWorld([
                { x: 5, y: 4 }, // candidate
                { x: 4, y: 4 }, // B1
                { x: 5, y: 3 }, // B2
            ]);
            addBuilding(world, { x: 4, y: 4 }); // B1
            addBuilding(world, { x: 5, y: 3 }); // B2
            const validator = createBuildingPlacementValidator(world);

            assert.strictEqual(validator({ x: 5, y: 4 }), true);
        });

        it("accepts placement when only one building is constrained to a sole tile and no other building shares it", () => {
            // After placement B1 is constrained to sole tile T=(4,3), but no
            // other building is adjacent to T, so there is no conflict.
            //
            // Candidate at (5,4), B1 at (4,4). Blockers seal B1's other exits.
            const world = createWorld([
                { x: 5, y: 4 }, // candidate
                { x: 4, y: 4 }, // B1
                { x: 4, y: 3 }, // T
            ]);
            addBuilding(world, { x: 4, y: 4 }); // B1
            addBuilding(world, { x: 3, y: 4 }); // blocks B1's west exit
            addBuilding(world, { x: 4, y: 5 }); // blocks B1's south exit
            const validator = createBuildingPlacementValidator(world);

            // B1 sole exit = T=(4,3). No other building has T as its sole exit → no conflict.
            assert.strictEqual(validator({ x: 5, y: 4 }), true);
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
