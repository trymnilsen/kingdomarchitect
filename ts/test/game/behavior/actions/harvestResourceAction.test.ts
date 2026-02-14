import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createResourceComponent,
} from "../../../../src/game/component/resourceComponent.ts";
import { executeHarvestResourceAction } from "../../../../src/game/behavior/actions/harvestResourceAction.ts";
import { ResourceHarvestMode } from "../../../../src/data/inventory/items/naturalResource.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/Action.ts";
import { InvalidationTracker } from "../behaviorTestHelpers.ts";

type HarvestResourceAction = Extract<BehaviorActionData, { type: "harvestResource" }>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    resource: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const resource = new Entity("resource");

    worker.worldPosition = { x: 0, y: 0 };
    resource.worldPosition = { x: 1, y: 0 }; // Adjacent

    worker.setEcsComponent(createInventoryComponent());
    resource.setEcsComponent(createResourceComponent("tree1"));
    resource.setEcsComponent(createHealthComponent(30, 30));

    root.addChild(worker);
    root.addChild(resource);

    return { root, worker, resource };
}

describe("harvestResourceAction", () => {
    describe("Chop mode", () => {
        it("deals damage to resource each tick", () => {
            const { worker, resource } = createTestScene();

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "running");

            const healthComponent =
                resource.getEcsComponent(HealthComponentId)!;
            assert.strictEqual(healthComponent.currentHp, 20);
        });

        it("completes and grants yields when hp reaches 0", () => {
            const { worker, resource } = createTestScene();

            const healthComponent =
                resource.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 5;

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "complete");

            const workerInventory =
                worker.getEcsComponent(InventoryComponentId)!;
            const wood = getInventoryItem(workerInventory, "wood");
            assert.ok(wood);
            assert.strictEqual(wood.amount, 10);
        });

        it("removes resource entity on completion", () => {
            const { root, worker, resource } = createTestScene();

            const healthComponent =
                resource.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 5;

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(root.findEntity("resource"), null);
        });
    });

    describe("Work-based harvest (Mine/Pick/Cut)", () => {
        it("tracks progress on action object", () => {
            const { worker, resource } = createTestScene();
            resource.setEcsComponent(createResourceComponent("stone1"));
            // Stone resource has workDuration: 3

            const action: HarvestResourceAction = {
                type: "harvestResource",
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Mine,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "running");
            assert.strictEqual(action.workProgress, 1);
        });

        it("completes when workProgress reaches workDuration", () => {
            const { worker, resource } = createTestScene();
            resource.setEcsComponent(createResourceComponent("stone1"));

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Mine,
                workProgress: 2,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "complete");

            const workerInventory =
                worker.getEcsComponent(InventoryComponentId)!;
            const stone = getInventoryItem(workerInventory, "stone");
            assert.ok(stone);
            assert.strictEqual(stone.amount, 2);
        });
    });

    describe("Error handling", () => {
        it("fails if resource entity not found", () => {
            const { worker } = createTestScene();

            const action = {
                type: "harvestResource" as const,
                entityId: "nonexistent",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "failed");
        });

        it("fails if worker not adjacent to resource", () => {
            const { worker, resource } = createTestScene();
            resource.worldPosition = { x: 10, y: 10 };

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "failed");
        });

        it("fails if worker is at same position as resource (not adjacent)", () => {
            const { worker, resource } = createTestScene();
            // Worker and resource at exact same position - a point is NOT adjacent to itself
            worker.worldPosition = { x: 5, y: 5 };
            resource.worldPosition = { x: 5, y: 5 };

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "failed");
        });

        it("fails if resource has no ResourceComponent", () => {
            const { root, worker } = createTestScene();
            const noResource = new Entity("noResource");
            noResource.worldPosition = { x: 1, y: 0 };
            root.addChild(noResource);

            const action = {
                type: "harvestResource" as const,
                entityId: "noResource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result, "failed");
        });

        it("throws if worker has no inventory", () => {
            const { root, resource } = createTestScene();
            const workerNoInv = new Entity("workerNoInv");
            workerNoInv.worldPosition = { x: 0, y: 0 };
            root.addChild(workerNoInv);

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            assert.throws(() => {
                executeHarvestResourceAction(action, workerNoInv, 0);
            });
        });

        it("throws if chop mode resource has no HealthComponent", () => {
            const { root, worker } = createTestScene();
            const noHealth = new Entity("noHealth");
            noHealth.worldPosition = { x: 1, y: 0 };
            noHealth.setEcsComponent(createResourceComponent("tree1"));
            root.addChild(noHealth);

            const action = {
                type: "harvestResource" as const,
                entityId: "noHealth",
                harvestAction: ResourceHarvestMode.Chop,
            };

            assert.throws(() => {
                executeHarvestResourceAction(action, worker, 0);
            });
        });
    });

    describe("component invalidation", () => {
        it("invalidates HealthComponent when chopping", () => {
            const { root, worker, resource } = createTestScene();
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(
                tracker.wasInvalidated("resource", HealthComponentId),
                true,
                "HealthComponent should be invalidated when chopping",
            );
        });

        it("invalidates InventoryComponent when harvest completes", () => {
            const { root, worker, resource } = createTestScene();
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const healthComponent = resource.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 5;

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(
                tracker.wasInvalidated("worker", InventoryComponentId),
                true,
                "InventoryComponent should be invalidated when yields are granted",
            );
        });

        it("invalidates InventoryComponent when work-based harvest completes", () => {
            const { root, worker, resource } = createTestScene();
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            resource.setEcsComponent(createResourceComponent("stone1"));

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Mine,
                workProgress: 2,
            };

            executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(
                tracker.wasInvalidated("worker", InventoryComponentId),
                true,
                "InventoryComponent should be invalidated when work-based harvest completes",
            );
        });
    });
});
