import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../../src/common/point.ts";
import { SparseSet } from "../../../../src/common/structure/sparseSet.ts";
import {
    ChunkMapComponentId,
    createChunkMapComponent,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createGoblinUnitComponent } from "../../../../src/game/component/goblinUnitComponent.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { ChunkSize } from "../../../../src/game/map/chunk.ts";
import { getWeightAtPoint } from "../../../../src/game/map/path/graph/weight.ts";
import { goblinHut } from "../../../../src/data/building/goblin/goblinHut.ts";
import { goblinCampfire } from "../../../../src/data/building/goblin/goblinCampfire.ts";
import { road } from "../../../../src/data/building/stone/road.ts";
import { createPlayerUnitComponent } from "../../../../src/game/component/playerUnitComponent.ts";

const TEST_POS: Point = { x: 5, y: 4 };

/**
 * Creates a root entity with a tiled chunk covering TEST_POS
 * and an empty chunk map.
 */
function createWorld(): Entity {
    const root = new Entity("root");
    const tileComponent = createTileComponent();
    const chunkMapComponent = createChunkMapComponent();

    setChunk(tileComponent, {
        chunkX: Math.floor(TEST_POS.x / ChunkSize),
        chunkY: Math.floor(TEST_POS.y / ChunkSize),
    });

    root.setEcsComponent(tileComponent);
    root.setEcsComponent(chunkMapComponent);
    return root;
}

/**
 * Adds an entity at TEST_POS to root's chunk map.
 * worldPosition must be set before calling this so getEntitiesAt can match it.
 */
function placeAt(root: Entity, entity: Entity, pos: Point = TEST_POS): void {
    entity.worldPosition = pos;

    const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
    const chunkX = Math.floor(pos.x / ChunkSize);
    const chunkY = Math.floor(pos.y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    if (!chunkMap.chunks.has(chunkKey)) {
        chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
    }
    chunkMap.chunks.get(chunkKey)!.add(entity);
}

describe("getWeightAtPoint", () => {
    describe("ground tile", () => {
        it("returns 2 for an empty tiled position", () => {
            const root = createWorld();

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 2);
        });

        it("returns 0 when there is no ground tile at the position", () => {
            const root = createWorld();
            // Chunk (3,3) is never registered, so (25,25) has no ground.
            assert.strictEqual(getWeightAtPoint({ x: 25, y: 25 }, root), 0);
        });
    });

    describe("goblin buildings", () => {
        it("returns 100 for a goblin hut", () => {
            const root = createWorld();
            const hutEntity = new Entity("hut");
            hutEntity.setEcsComponent(createBuildingComponent(goblinHut, false));
            placeAt(root, hutEntity);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 100);
        });

        it("returns 100 for a scaffolded goblin hut (under construction)", () => {
            const root = createWorld();
            const hutEntity = new Entity("hut-scaffold");
            hutEntity.setEcsComponent(createBuildingComponent(goblinHut, true));
            placeAt(root, hutEntity);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 100);
        });

        it("returns 100 for a goblin campfire", () => {
            const root = createWorld();
            const campfireEntity = new Entity("campfire");
            campfireEntity.setEcsComponent(
                createBuildingComponent(goblinCampfire, false),
            );
            placeAt(root, campfireEntity);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 100);
        });
    });

    describe("road", () => {
        it("returns 1 for a road building", () => {
            const root = createWorld();
            const roadEntity = new Entity("road");
            roadEntity.setEcsComponent(createBuildingComponent(road, false));
            placeAt(root, roadEntity);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 1);
        });
    });

    describe("units", () => {
        it("returns 50 for a goblin unit", () => {
            const root = createWorld();
            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));
            placeAt(root, goblin);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 50);
        });

        it("returns 100 for a player unit", () => {
            const root = createWorld();
            const worker = new Entity("worker");
            worker.setEcsComponent(createPlayerUnitComponent());
            placeAt(root, worker);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 100);
        });
    });

    describe("resource", () => {
        it("returns 30 for a resource entity", () => {
            const root = createWorld();
            const tree = new Entity("tree");
            tree.setEcsComponent(createResourceComponent("tree1"));
            placeAt(root, tree);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 30);
        });
    });

    describe("multiple entities at the same position", () => {
        it("returns the highest weight when a building and resource overlap", () => {
            // A resource (30) sitting on the same tile as a building (100)
            // should not let the resource's lower weight override the building.
            const root = createWorld();
            const building = new Entity("building");
            building.setEcsComponent(createBuildingComponent(goblinHut, false));
            placeAt(root, building);

            const resource = new Entity("resource");
            resource.setEcsComponent(createResourceComponent("tree1"));
            placeAt(root, resource);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 100);
        });

        it("returns the highest weight when a goblin unit and resource overlap", () => {
            const root = createWorld();
            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));
            placeAt(root, goblin);

            const resource = new Entity("resource");
            resource.setEcsComponent(createResourceComponent("tree1"));
            placeAt(root, resource);

            // Goblin weight is 50, resource is 30 — goblin wins
            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 50);
        });
    });
});
