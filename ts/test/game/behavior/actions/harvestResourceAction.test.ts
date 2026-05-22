import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import { executeHarvestResourceAction } from "../../../../src/game/behavior/actions/harvestResourceAction.ts";
import {
    ResourceHarvestMode,
    stoneResource,
    treeResource,
} from "../../../../src/data/inventory/items/naturalResource.ts";
import { stoneResource as stoneItem } from "../../../../src/data/inventory/items/resources.ts";
import { createPlayerKingdomComponent } from "../../../../src/game/component/playerKingdomComponent.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
} from "../../../../src/game/component/stockpileComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";
import { InvalidationTracker } from "../behaviorTestHelpers.ts";

type HarvestResourceAction = Extract<
    BehaviorActionData,
    { type: "harvestResource" }
>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    resource: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const resource = new Entity("resource");

    worker.worldPosition = { x: 10, y: 8 };
    resource.worldPosition = { x: 11, y: 8 }; // Adjacent

    worker.setEcsComponent(createHeldItemComponent());
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

            assert.strictEqual(result.kind, "running");

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

            assert.strictEqual(result.kind, "complete");

            const held = worker.getEcsComponent(HeldItemComponentId)!;
            assert.strictEqual(held.item?.id, "wood");
            assert.strictEqual(held.amount, treeResource.yields[0].amount);
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

    describe("Incompatible held item", () => {
        function createSettlementScene(): {
            settlement: Entity;
            worker: Entity;
            resource: Entity;
        } {
            const settlement = new Entity("settlement");
            settlement.setEcsComponent(createPlayerKingdomComponent());

            const worker = new Entity("worker");
            worker.worldPosition = { x: 10, y: 8 };
            const held = createHeldItemComponent();
            held.item = stoneItem; // tree yields wood — stone is incompatible
            held.amount = 4;
            worker.setEcsComponent(held);
            settlement.addChild(worker);

            const resource = new Entity("resource");
            resource.worldPosition = { x: 11, y: 8 }; // adjacent
            resource.setEcsComponent(createResourceComponent("tree1"));
            resource.setEcsComponent(createHealthComponent(30, 30));
            settlement.addChild(resource);

            return { settlement, worker, resource };
        }

        function addStockpile(settlement: Entity): Entity {
            const stockpile = new Entity("stockpile");
            const stockpileComp = createStockpileComponent();
            setPreferredAmount(stockpileComp, "stone", 50);
            stockpile.setEcsComponent(stockpileComp);
            stockpile.setEcsComponent(createInventoryComponent());
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 14, y: 8 };
            return stockpile;
        }

        it("deposits at an accepting stockpile then returns to the resource", () => {
            const { settlement, worker } = createSettlementScene();
            const stockpile = addStockpile(settlement);

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result.kind, "subaction");
            assert.deepStrictEqual(
                (result as { actions: BehaviorActionData[] }).actions,
                [
                    {
                        type: "moveTo",
                        target: stockpile.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    { type: "depositToStockpile", stockpileId: "stockpile" },
                    {
                        type: "moveTo",
                        target: { x: 11, y: 8 },
                        stopAdjacent: "cardinal",
                    },
                ],
            );
        });

        it("drops the held item in place when no stockpile accepts it", () => {
            const { worker } = createSettlementScene();
            // No stockpile added — nowhere to deposit the stone.

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result.kind, "subaction");
            assert.deepStrictEqual(
                (result as { actions: BehaviorActionData[] }).actions,
                [{ type: "dropHeld" }],
            );
        });

        it("does not damage the resource while the hand is full", () => {
            const { settlement, worker, resource } = createSettlementScene();
            addStockpile(settlement);

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            executeHarvestResourceAction(action, worker, 0);

            const health = resource.getEcsComponent(HealthComponentId)!;
            assert.strictEqual(health.currentHp, 30);
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

            assert.strictEqual(result.kind, "running");
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

            assert.strictEqual(result.kind, "complete");

            const held = worker.getEcsComponent(HeldItemComponentId)!;
            assert.strictEqual(held.item?.id, "stone");
            assert.strictEqual(held.amount, stoneResource.yields[0].amount);
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

            assert.strictEqual(result.kind, "failed");
        });

        it("fails if worker not adjacent to resource", () => {
            const { worker, resource } = createTestScene();
            resource.worldPosition = { x: 25, y: 25 };

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result.kind, "failed");
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

            assert.strictEqual(result.kind, "failed");
        });

        it("fails if resource has no ResourceComponent", () => {
            const { root, worker } = createTestScene();
            const noResource = new Entity("noResource");
            noResource.worldPosition = { x: 11, y: 8 };
            root.addChild(noResource);

            const action = {
                type: "harvestResource" as const,
                entityId: "noResource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            const result = executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(result.kind, "failed");
        });

        it("throws if worker has no held component", () => {
            const { root, resource } = createTestScene();
            const workerNoHeld = new Entity("workerNoHeld");
            workerNoHeld.worldPosition = { x: 10, y: 8 };
            root.addChild(workerNoHeld);

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            assert.throws(() => {
                executeHarvestResourceAction(action, workerNoHeld, 0);
            });
        });

        it("throws if chop mode resource has no HealthComponent", () => {
            const { root, worker } = createTestScene();
            const noHealth = new Entity("noHealth");
            noHealth.worldPosition = { x: 11, y: 8 };
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

            const healthComponent =
                resource.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 5;

            const action = {
                type: "harvestResource" as const,
                entityId: "resource",
                harvestAction: ResourceHarvestMode.Chop,
            };

            executeHarvestResourceAction(action, worker, 0);

            assert.strictEqual(
                tracker.wasInvalidated("worker", HeldItemComponentId),
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
                tracker.wasInvalidated("worker", HeldItemComponentId),
                true,
                "InventoryComponent should be invalidated when work-based harvest completes",
            );
        });
    });
});
