import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import {
    berryBushResource,
    cactusResource,
    snowTreeResource,
    treeResource,
    type NaturalResource,
} from "../../../../src/data/inventory/items/naturalResource.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planProduction } from "../../../../src/game/job/planner/productionPlanner.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { createProductionComponent } from "../../../../src/game/component/productionComponent.ts";
import {
    createHeldItemComponent,
    setHeldItem,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createOutputPolicyComponent,
    OutputPolicy,
    OutputPolicyComponentId,
} from "../../../../src/game/component/outputPolicyComponent.ts";
import type { BiomeType } from "../../../../src/game/map/biome.ts";
import { resourcePrefab } from "../../../../src/game/prefab/resourcePrefab.ts";
import { createWorldCovering, setChunkBiome } from "../../testWorld.ts";

/**
 * The zone is a radius-2 diamond, so twelve tiles around the building.
 * target = round(0.8 * 12) = 10, floor = floor(0.4 * 12) = 4.
 */
const TARGET = 10;
const FLOOR = 4;

const buildingPosition = { x: 20, y: 15 };

type PlantTreeAction = {
    type: "plantTree";
    resourceId: string;
    targetPosition: Point;
};
type HarvestAction = {
    type: "harvestResource";
    entityId: string;
    outputPolicy?: OutputPolicy;
};

type ZoneScene = {
    root: Entity;
    worker: Entity;
    building: Entity;
    stock: (count: number, resource?: NaturalResource) => Entity[];
    addAt: (position: Point, resource: NaturalResource) => Entity;
    plan: () => ReturnType<typeof planProduction>;
};

/**
 * A forrester whose zone sits wholly in one biome. Resources are made with
 * resourcePrefab because the zone queries read the chunk map, which only
 * indexes entities that carry a sprite.
 */
function createZoneScene(
    biome: BiomeType = "snow",
    position: Point = buildingPosition,
): ZoneScene {
    const { root } = createWorldCovering(
        { min: { x: 8, y: 8 }, max: { x: 31, y: 23 } },
        biome,
    );
    const worker = new Entity("worker");
    const building = new Entity("building");

    root.setEcsComponent(createJobQueueComponent());

    root.addChild(worker);
    root.addChild(building);

    worker.worldPosition = { x: 10, y: 8 };
    worker.setEcsComponent(createHeldItemComponent());
    building.worldPosition = position;

    building.setEcsComponent(createProductionComponent("forrester_production"));
    building.setEcsComponent(createOutputPolicyComponent());

    const addAt = (at: Point, resource: NaturalResource) => {
        const entity = resourcePrefab(resource);
        root.addChild(entity);
        entity.worldPosition = at;
        return entity;
    };

    const stock = (
        count: number,
        resource: NaturalResource = snowTreeResource,
    ) => zoneTiles(position, count).map((tile) => addAt(tile, resource));

    const plan = () =>
        planProduction(root, worker, createProductionJob("building"));

    return { root, worker, building, stock, addAt, plan };
}

/** The zone's tiles, nearest first, so a test can stock an exact count. */
function zoneTiles(center: Point, count: number): Point[] {
    const offsets = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
        { x: 1, y: 1 },
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
    ];
    assert.ok(count <= offsets.length, "the zone holds twelve tiles");
    return offsets.slice(0, count).map((offset) => ({
        x: center.x + offset.x,
        y: center.y + offset.y,
    }));
}

function actionTypes(actions: { type: string }[]): string[] {
    return actions.map((action) => action.type);
}

describe("productionPlanner - zone kind", () => {
    describe("plant and fell balance", () => {
        it("plants without felling below the safety floor", () => {
            const scene = createZoneScene();
            scene.stock(FLOOR - 1);

            assert.deepStrictEqual(actionTypes(scene.plan()), [
                "moveTo",
                "plantTree",
            ]);
        });

        it("starts felling once the zone reaches the floor", () => {
            const scene = createZoneScene();
            const standing = scene.stock(FLOOR);

            const actions = scene.plan();

            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "plantTree",
                "moveTo",
                "harvestResource",
            ]);
            const felled = (actions[3] as HarvestAction).entityId;
            assert.ok(
                standing.some((tree) => tree.id === felled),
                "the tree felled is one that was already standing",
            );
        });

        it("stops planting once the zone reaches its target population", () => {
            const scene = createZoneScene();
            scene.stock(TARGET);

            assert.deepStrictEqual(actionTypes(scene.plan()), [
                "moveTo",
                "harvestResource",
            ]);
        });

        it("drops the order when it can neither plant nor fell", () => {
            // Plains grow nothing, so an empty zone there offers no work.
            const scene = createZoneScene("plains");
            const job = createProductionJob("building");
            scene.root.requireEcsComponent(JobQueueComponentId).jobs.push(job);

            const actions = planProduction(scene.root, scene.worker, job);

            assert.strictEqual(actions.length, 0);
            assert.strictEqual(
                scene.root.requireEcsComponent(JobQueueComponentId).jobs.length,
                0,
                "an order nobody can act on is not left in the queue",
            );
        });
    });

    describe("what counts as a tree", () => {
        it("counts every felled species, not just the one it plants", () => {
            const scene = createZoneScene();
            scene.stock(TARGET, cactusResource);

            assert.deepStrictEqual(
                actionTypes(scene.plan()),
                ["moveTo", "harvestResource"],
                "ten cacti fill the zone as surely as ten trees",
            );
        });

        it("ignores resources that are gathered rather than felled", () => {
            const scene = createZoneScene();
            scene.stock(TARGET, berryBushResource);

            assert.deepStrictEqual(
                actionTypes(scene.plan()),
                ["moveTo", "plantTree"],
                "a zone full of bushes is still an empty forest",
            );
        });
    });

    describe("biome of the planting spot", () => {
        /**
         * A forrester on the last tile of a snow chunk, so the eastern half of
         * its zone reaches into the neighbouring forest chunk.
         */
        function straddlingScene(): ZoneScene {
            const scene = createZoneScene("snow", { x: 23, y: 12 });
            setChunkBiome(scene.root, { x: 3, y: 1 }, "forrest");
            return scene;
        }

        /** Zone tiles on the far side of the chunk edge, at x >= 24. */
        const forestSide: Point[] = [
            { x: 24, y: 11 },
            { x: 24, y: 12 },
            { x: 24, y: 13 },
            { x: 25, y: 12 },
        ];
        const snowSide: Point[] = zoneTiles({ x: 23, y: 12 }, 12).filter(
            (tile) => tile.x < 24,
        );

        it("plants the neighbouring biome's tree when only that side is free", () => {
            const scene = straddlingScene();
            for (const tile of snowSide) {
                scene.addAt(tile, snowTreeResource);
            }

            const actions = scene.plan();
            const plant = actions[1] as PlantTreeAction;

            assert.strictEqual(
                plant.resourceId,
                treeResource.id,
                "the forest side of the zone grows forest trees, even though the building stands in the snow",
            );
            assert.ok(
                forestSide.some(
                    (tile) =>
                        tile.x === plant.targetPosition.x &&
                        tile.y === plant.targetPosition.y,
                ),
                "it planted on the forest side",
            );
        });

        it("plants its own biome's tree when only that side is free", () => {
            const scene = straddlingScene();
            for (const tile of forestSide) {
                scene.addAt(tile, treeResource);
            }

            const plant = scene.plan()[1] as PlantTreeAction;

            assert.strictEqual(plant.resourceId, snowTreeResource.id);
            assert.ok(
                snowSide.some(
                    (tile) =>
                        tile.x === plant.targetPosition.x &&
                        tile.y === plant.targetPosition.y,
                ),
                "it planted on the snow side",
            );
        });

        it("never plants on a tile whose biome grows nothing", () => {
            const scene = createZoneScene("snow", { x: 23, y: 12 });
            setChunkBiome(scene.root, { x: 3, y: 1 }, "plains");
            for (const tile of snowSide) {
                scene.addAt(tile, snowTreeResource);
            }

            assert.deepStrictEqual(
                actionTypes(scene.plan()),
                ["moveTo", "harvestResource"],
                "the plains half is not plantable, so the order is a felling alone",
            );
        });
    });

    describe("output policy", () => {
        it("carries the building's policy into the felling", () => {
            const scene = createZoneScene();
            scene.stock(TARGET);
            scene.building.requireEcsComponent(OutputPolicyComponentId).policy =
                OutputPolicy.Drop;

            const actions = scene.plan();

            assert.strictEqual(
                (actions[1] as HarvestAction).outputPolicy,
                OutputPolicy.Drop,
            );
        });

        it("empties the hand first when the timber is to be hauled", () => {
            const scene = createZoneScene();
            scene.stock(TARGET);
            setHeldItem(
                scene.worker.requireEcsComponent(createHeldItemComponent().id),
                woodResourceItem,
                3,
            );

            assert.deepStrictEqual(actionTypes(scene.plan()), [
                "dropHeld",
                "moveTo",
                "harvestResource",
            ]);
        });

        it("fells with a full hand when the timber is to be dropped", () => {
            const scene = createZoneScene();
            scene.stock(TARGET);
            scene.building.requireEcsComponent(OutputPolicyComponentId).policy =
                OutputPolicy.Drop;
            setHeldItem(
                scene.worker.requireEcsComponent(createHeldItemComponent().id),
                woodResourceItem,
                3,
            );

            assert.deepStrictEqual(
                actionTypes(scene.plan()),
                ["moveTo", "harvestResource"],
                "nothing is set down, because the yields never reach the hand",
            );
        });
    });
});
