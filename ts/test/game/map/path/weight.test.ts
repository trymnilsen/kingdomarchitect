import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import {
    ChunkMapComponentId,
    createChunkMapComponent,
    indexEntity,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createGoblinUnitComponent } from "../../../../src/game/component/goblinUnitComponent.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    ChunkSize,
    createLandTerrain,
    terrainIndex,
} from "../../../../src/game/map/chunk.ts";
import { Terrain } from "../../../../src/game/map/terrain.ts";
import {
    getWeightAtPoint,
    isTileAvailable,
} from "../../../../src/game/map/path/graph/weight.ts";
import { goblinHut } from "../../../../src/data/building/goblin/goblinHut.ts";
import { goblinCampfire } from "../../../../src/data/building/goblin/goblinCampfire.ts";
import { road } from "../../../../src/data/building/gold/road.ts";
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
    describe("ground tile", () => {
        it("returns 2 for an empty tiled position", () => {
            const root = createWorld();

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 2);
        });

        it("returns 0 when there is no ground tile at the position", () => {
            const root = createWorld();
            // Chunk (3,3) is never registered, so its tiles have no ground.
            const unregistered = { x: 3 * ChunkSize + 1, y: 3 * ChunkSize + 1 };
            assert.strictEqual(getWeightAtPoint(unregistered, root), 0);
        });
    });

    describe("terrain", () => {
        // away from the origin so a world vs local mixup lands on the wrong tile
        const pondPos: Point = { x: 2 * ChunkSize + 5, y: ChunkSize + 4 };
        const besidePond: Point = { x: pondPos.x + 1, y: pondPos.y };

        function createWorldWithPond(pond: Terrain): Entity {
            const root = new Entity("root");
            const tileComponent = createTileComponent();
            const terrain = createLandTerrain();
            terrain[terrainIndex(5, 4)] = pond;
            setChunk(tileComponent, { chunkX: 2, chunkY: 1, terrain });
            root.setEcsComponent(tileComponent);
            root.setEcsComponent(createChunkMapComponent());
            return root;
        }

        it("returns 0 for water and leaves its neighbour walkable", () => {
            const root = createWorldWithPond(Terrain.Water);

            assert.strictEqual(getWeightAtPoint(pondPos, root), 0);
            assert.strictEqual(isTileAvailable(pondPos, root), false);
            assert.strictEqual(getWeightAtPoint(besidePond, root), 2);
        });

        it("ignores entity weight on water", () => {
            const root = createWorldWithPond(Terrain.Water);
            const roadEntity = new Entity("road");
            roadEntity.setEcsComponent(createBuildingComponent(road, false));
            placeAt(root, roadEntity, pondPos);

            assert.strictEqual(getWeightAtPoint(pondPos, root), 0);
        });

        it("lets ice be crossed at a higher cost than land", () => {
            const root = createWorldWithPond(Terrain.Ice);

            const iceWeight = getWeightAtPoint(pondPos, root);
            assert.ok(iceWeight > getWeightAtPoint(besidePond, root));
            assert.strictEqual(isTileAvailable(pondPos, root), true);
        });

        it("lets a unit on ice weigh the same as anywhere else", () => {
            const root = createWorldWithPond(Terrain.Ice);
            const worker = new Entity("worker");
            worker.setEcsComponent(createPlayerUnitComponent());
            placeAt(root, worker, pondPos);

            assert.strictEqual(getWeightAtPoint(pondPos, root), 100);
        });
    });

    describe("goblin buildings", () => {
        it("returns 100 for a goblin hut", () => {
            const root = createWorld();
            const hutEntity = new Entity("hut");
            hutEntity.setEcsComponent(
                createBuildingComponent(goblinHut, false),
            );
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

        it("returns the ground weight for a decorative resource (grass)", () => {
            const root = createWorld();
            const grass = new Entity("grass");
            grass.setEcsComponent(createResourceComponent("grass"));
            placeAt(root, grass);

            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 2);
        });
    });

    describe("isTileAvailable", () => {
        it("treats a decorative resource (grass) as available", () => {
            const root = createWorld();
            const grass = new Entity("grass");
            grass.setEcsComponent(createResourceComponent("grass"));
            placeAt(root, grass);

            assert.strictEqual(isTileAvailable(TEST_POS, root), true);
        });

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

        it("returns the highest weight when a goblin unit and resource overlap", () => {
            const root = createWorld();
            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));
            placeAt(root, goblin);

            const resource = new Entity("resource");
            resource.setEcsComponent(createResourceComponent("tree1"));
            placeAt(root, resource);

            // Goblin weight is 50, resource is 30, so goblin wins
            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 50);
        });

        it("returns the goblin weight when a goblin overlaps decorative grass", () => {
            const root = createWorld();
            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));
            placeAt(root, goblin);

            const grass = new Entity("grass");
            grass.setEcsComponent(createResourceComponent("grass"));
            placeAt(root, grass);

            // Grass contributes no weight, so the goblin's 50 applies
            assert.strictEqual(getWeightAtPoint(TEST_POS, root), 50);
        });
    });
});
