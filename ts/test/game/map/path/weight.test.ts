import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import {
    ChunkMapComponentId,
    createChunkMapComponent,
    indexEntity,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    ChunkSize,
    createLandTerrain,
} from "../../../../src/game/map/chunk.ts";
import {
    getWeightAtPoint,
    isTileAvailable,
} from "../../../../src/game/map/path/graph/weight.ts";
import { goblinHut } from "../../../../src/data/building/goblin/goblinHut.ts";

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
        terrain: createLandTerrain(),
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
    indexEntity(root.requireEcsComponent(ChunkMapComponentId).chunkMap, entity);
}

describe("getWeightAtPoint", () => {
    describe("resource", () => {
        it("returns the ground weight for a decorative resource (grass)", () => {
            const root = createWorld();
            const grass = new Entity("grass");
            grass.setEcsComponent(createResourceComponent("grass"));
            placeAt(root, grass);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 2);
        });
    });

    describe("isTileAvailable", () => {
        it("treats a clearable obstacle (tree) as available", () => {
            const root = createWorld();
            const tree = new Entity("tree");
            tree.setEcsComponent(createResourceComponent("tree1"));
            placeAt(root, tree);

            assert.strictEqual(isTileAvailable(TEST_POS, root), true);
        });

        it("treats a permanent obstacle (stone) as unavailable", () => {
            const root = createWorld();
            const stone = new Entity("stone");
            stone.setEcsComponent(createResourceComponent("stone1"));
            placeAt(root, stone);

            assert.strictEqual(isTileAvailable(TEST_POS, root), false);
        });

        it("treats a tile with no ground as unavailable", () => {
            const root = createWorld();
            assert.strictEqual(isTileAvailable({ x: 25, y: 25 }, root), false);
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
    });
});
