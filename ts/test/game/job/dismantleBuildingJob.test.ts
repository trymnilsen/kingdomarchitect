import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../src/game/map/path/graph/generateGraph.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { blacksmith } from "../../../src/data/building/stone/blacksmith.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    gemResource,
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import {
    createOccupationComponent,
    OccupationComponentId,
} from "../../../src/game/component/occupationComponent.ts";
import { WorkplaceComponentId } from "../../../src/game/component/workplaceComponent.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import { createProductionJob } from "../../../src/game/job/productionJob.ts";
import {
    createDismantleBuildingJob,
    DismantleBuildingJobId,
    finishDismantle,
} from "../../../src/game/job/dismantleBuildingJob.ts";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/BehaviorSystem.ts";
import { createBehaviorResolver } from "../../../src/game/behavior/behaviorResolver.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import type { Point } from "../../../src/common/point.ts";
import type { TileChunk } from "../../../src/game/map/chunk.ts";

function createWorld(bounds: { min: Point; max: Point }): Entity {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    for (
        let cx = Math.floor(bounds.min.x / 8) - 1;
        cx <= Math.floor(bounds.max.x / 8) + 1;
        cx++
    ) {
        for (
            let cy = Math.floor(bounds.min.y / 8) - 1;
            cy <= Math.floor(bounds.max.y / 8) + 1;
            cy++
        ) {
            const chunk: TileChunk = { chunkX: cx, chunkY: cy };
            setChunk(tileComponent, chunk);
        }
    }
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );

    return root;
}

function totalOnGround(root: Entity, itemId: string): number {
    let total = 0;
    for (const [entity, collectable] of root.queryComponents(
        CollectableComponentId,
    )) {
        if (!entity.hasComponent(GroundItemComponentId)) continue;
        for (const stack of collectable.items) {
            if (stack.item.id === itemId) total += stack.amount;
        }
    }
    return total;
}

describe("finishDismantle", () => {
    it("refunds materials, scatters inventory, evicts workers, clears jobs, and removes the building", () => {
        const root = createWorld({ min: { x: 4, y: 2 }, max: { x: 24, y: 16 } });

        const kingdom = new Entity("playerKingdom");
        kingdom.setEcsComponent(createPlayerKingdomComponent());
        kingdom.setEcsComponent(createJobQueueComponent());
        root.addChild(kingdom);
        kingdom.worldPosition = { x: 12, y: 8 };

        // Completed blacksmith: requires 20 wood + 30 stone (both refundable).
        const building = buildingPrefab(blacksmith, false, "blacksmith1");
        kingdom.addChild(building);
        building.worldPosition = { x: 12, y: 8 };

        // Stored goods inside the (completed) building should be scattered too.
        const inventory = building.requireEcsComponent(InventoryComponentId);
        addInventoryItem(inventory, gemResource, 2);

        // A worker assigned to the building.
        const worker = new Entity("worker1");
        const occupation = createOccupationComponent();
        occupation.workplace = building.id;
        worker.setEcsComponent(occupation);
        kingdom.addChild(worker);
        worker.worldPosition = { x: 13, y: 8 };
        building.requireEcsComponent(WorkplaceComponentId).workers.push(
            worker.id,
        );

        // Jobs: one targeting this building (should be cleared), one targeting
        // a different building (should survive), and the dismantle job itself
        // (should survive — the action completes it).
        const jobQueue = kingdom.requireEcsComponent(JobQueueComponentId);
        jobQueue.jobs.push(createProductionJob(building.id));
        jobQueue.jobs.push(createProductionJob("otherBuilding"));
        jobQueue.jobs.push(createDismantleBuildingJob(building.id));

        finishDismantle(root, building);

        // Entity removed from the tree.
        assert.ok(
            !kingdom.children.some((c) => c.id === building.id),
            "building should be removed from its parent",
        );

        // Worker un-assigned.
        assert.strictEqual(
            worker.getEcsComponent(OccupationComponentId)!.workplace,
            undefined,
            "worker workplace should be cleared",
        );

        // Refund + scatter landed on the ground.
        assert.strictEqual(
            totalOnGround(root, woodResourceItem.id),
            20,
            "20 wood should be refunded",
        );
        assert.strictEqual(
            totalOnGround(root, stoneResource.id),
            30,
            "30 stone should be refunded",
        );
        assert.strictEqual(
            totalOnGround(root, gemResource.id),
            2,
            "stored gems should be scattered",
        );

        // Job bookkeeping.
        const remaining = jobQueue.jobs;
        assert.ok(
            !remaining.some(
                (j) => j.id === "productionJob" && j.targetBuilding === building.id,
            ),
            "jobs targeting the dismantled building should be cleared",
        );
        assert.ok(
            remaining.some(
                (j) =>
                    j.id === "productionJob" &&
                    j.targetBuilding === "otherBuilding",
            ),
            "jobs targeting other buildings should survive",
        );
        assert.ok(
            remaining.some((j) => j.id === DismantleBuildingJobId),
            "the dismantle job itself should survive for the action to complete",
        );
    });

    it("a worker actually claims a queued dismantle job and removes the building", () => {
        // End-to-end through the behavior loop. This is the path that the
        // direct finishDismantle test above does NOT cover: it exercises
        // getJobTargetPosition / PerformJobBehavior, which is where a missing
        // job-target case would silently strand the job forever.
        const root = createWorld({ min: { x: 4, y: 2 }, max: { x: 24, y: 16 } });

        const kingdom = new Entity("playerKingdom");
        kingdom.setEcsComponent(createPlayerKingdomComponent());
        kingdom.setEcsComponent(createJobQueueComponent());
        root.addChild(kingdom);
        kingdom.worldPosition = { x: 12, y: 8 };

        const building = buildingPrefab(stockPile, false, "stockpile1");
        kingdom.addChild(building);
        building.worldPosition = { x: 12, y: 8 };

        const worker = workerPrefab();
        kingdom.addChild(worker);
        worker.worldPosition = { x: 13, y: 8 };

        const jobQueue = kingdom.requireEcsComponent(JobQueueComponentId);
        jobQueue.jobs.push(createDismantleBuildingJob(building.id));

        const behaviorSystem = createBehaviorSystem(createBehaviorResolver());
        for (let tick = 1; tick <= 40; tick++) {
            behaviorSystem.onUpdate!(root, tick);
        }

        assert.ok(
            !kingdom.children.some((c) => c.id === building.id),
            "worker should have claimed the dismantle job and removed the building",
        );
        assert.ok(
            !jobQueue.jobs.some((j) => j.id === DismantleBuildingJobId),
            "dismantle job should be completed and gone from the queue",
        );
    });
});
