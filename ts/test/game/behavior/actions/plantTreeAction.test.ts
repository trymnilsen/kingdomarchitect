import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createProductionComponent } from "../../../../src/game/component/productionComponent.ts";
import { ResourceComponentId } from "../../../../src/game/component/resourceComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { executePlantTreeAction } from "../../../../src/game/behavior/actions/plantTreeAction.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/actionData.ts";
import { forresterProduction } from "../../../../src/data/production/productionDefinition.ts";
import { claimJobInQueue } from "../../../../src/game/job/jobLifecycle.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";

type PlantTreeAction = Extract<BehaviorActionData, { type: "plantTree" }>;

const plantSpot = { x: 13, y: 8 };

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    root.addChild(worker);
    root.addChild(building);

    // The worker stands beside the spot, which is where the planner puts it:
    // a free tile is one no entity occupies, and the worker is an entity.
    worker.worldPosition = { x: 12, y: 8 };
    building.worldPosition = { x: 20, y: 15 };

    building.setEcsComponent(createProductionComponent("forrester_production"));

    return { root, worker, building };
}

function plantAction(
    overrides: Partial<PlantTreeAction> = {},
): PlantTreeAction {
    return {
        type: "plantTree",
        buildingId: "building",
        targetPosition: plantSpot,
        resourceIdToPlant: "tree1",
        ...overrides,
    };
}

function treesIn(root: Entity, resourceId: string): Entity[] {
    return root.children.filter(
        (child) =>
            child.getEcsComponent(ResourceComponentId)?.resourceId ===
            resourceId,
    );
}

describe("plantTreeAction", () => {
    it("takes plantDuration ticks of work before anything grows", () => {
        const { root, worker } = createTestScene();
        const action = plantAction({ resourceIdToPlant: "pineTreeSnow" });

        for (let tick = 1; tick < forresterProduction.plantDuration; tick++) {
            const result = executePlantTreeAction(action, worker);
            assert.strictEqual(result.kind, "running", `tick ${tick}`);
            assert.strictEqual(
                treesIn(root, "pineTreeSnow").length,
                0,
                `nothing has grown by tick ${tick}`,
            );
        }

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        const spawned = treesIn(root, "pineTreeSnow");
        assert.strictEqual(
            spawned.length,
            1,
            "it plants the species it was handed, not the building's own",
        );
        assert.deepStrictEqual(spawned[0].worldPosition, plantSpot);
    });

    it("leaves the claimed order in the queue, since the felling completes it", () => {
        const root = new Entity("root");
        const settlement = new Entity("settlement");
        const worker = new Entity("worker");
        const building = new Entity("building");

        root.addChild(settlement);
        settlement.setEcsComponent(createJobQueueComponent());
        settlement.addChild(worker);
        root.addChild(building);

        worker.worldPosition = { x: 12, y: 8 };
        building.worldPosition = { x: 20, y: 15 };
        building.setEcsComponent(
            createProductionComponent("forrester_production"),
        );

        const job = createProductionJob("building");
        const jobQueue = settlement.requireEcsComponent(JobQueueComponentId);
        jobQueue.jobs.push(job);
        claimJobInQueue(job, worker.id, settlement);

        executePlantTreeAction(
            plantAction({ progress: forresterProduction.plantDuration - 1 }),
            worker,
        );

        const stillClaimed = settlement
            .requireEcsComponent(JobQueueComponentId)
            .jobs.find((queued) => queued.claimedBy === worker.id);
        assert.ok(stillClaimed, "the order outlives the planting");
    });

    it("fails when the worker is nowhere near the spot", () => {
        const { worker } = createTestScene();

        const result = executePlantTreeAction(
            plantAction({ targetPosition: { x: 25, y: 19 } }),
            worker,
        );

        assert.strictEqual(result.kind, "failed");
    });
});
