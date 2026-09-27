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
    setHeldItem,
} from "../../../../src/game/component/heldItemComponent.ts";
import { CollectableComponentId } from "../../../../src/game/component/collectableComponent.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import { OutputPolicy } from "../../../../src/game/component/outputPolicyComponent.ts";
import { zeroPoint, type Point } from "../../../../src/common/point.ts";
import { createMinimalWorld } from "../../testWorld.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import { executeHarvestResourceAction } from "../../../../src/game/behavior/actions/harvestResourceAction.ts";
import {
    mushroomResource,
    ResourceHarvestMode,
    stoneResource,
    treeResource,
    type NaturalResource,
} from "../../../../src/data/inventory/items/naturalResource.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { claimJobInQueue } from "../../../../src/game/job/jobLifecycle.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import { stoneResource as stoneItem } from "../../../../src/data/inventory/items/resources.ts";
import { createPlayerKingdomComponent } from "../../../../src/game/component/playerKingdomComponent.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
} from "../../../../src/game/component/stockpileComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/actionData.ts";
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
    });

    describe("Drop output policy", () => {
        const stumpPosition = { x: 11, y: 8 };

        /**
         * A resource beside a worker, in a world piles can be dropped into.
         * The resource is one tick from falling, so a single call fells it.
         */
        function createDropScene(resource: NaturalResource = treeResource): {
            root: Entity;
            worker: Entity;
            settlement: Entity;
        } {
            const { root } = createMinimalWorld();
            const settlement = new Entity("settlement");
            const worker = new Entity("worker");
            const standing = new Entity("resource");

            settlement.setEcsComponent(createJobQueueComponent());
            worker.setEcsComponent(createHeldItemComponent());
            standing.setEcsComponent(createResourceComponent(resource.id));
            standing.setEcsComponent(createHealthComponent(5, 5));
            standing.setEcsComponent(
                createSpriteComponent(resource.asset, zeroPoint()),
            );

            root.addChild(settlement);
            settlement.addChild(worker);
            root.addChild(standing);
            worker.worldPosition = { x: 10, y: 8 };
            standing.worldPosition = stumpPosition;

            return { root, worker, settlement };
        }

        function groundPiles(
            root: Entity,
            itemId: string,
        ): { position: Point; amount: number }[] {
            const piles: { position: Point; amount: number }[] = [];
            for (const [pile, collectable] of root.queryComponents(
                CollectableComponentId,
            )) {
                for (const stack of collectable.items) {
                    if (stack.item.id === itemId) {
                        piles.push({
                            position: pile.worldPosition,
                            amount: stack.amount,
                        });
                    }
                }
            }
            return piles;
        }

        function dropChop(entityId: string): HarvestResourceAction {
            return {
                type: "harvestResource",
                entityId,
                harvestAction: ResourceHarvestMode.Chop,
                outputPolicy: OutputPolicy.Drop,
            };
        }

        it("leaves the yields on the tile the resource stood on", () => {
            const { root, worker } = createDropScene();

            const result = executeHarvestResourceAction(
                dropChop("resource"),
                worker,
                0,
            );

            assert.strictEqual(result.kind, "complete");
            assert.strictEqual(
                worker.requireEcsComponent(HeldItemComponentId).item,
                null,
                "the feller keeps its hands free",
            );
            const piles = groundPiles(root, "wood");
            assert.strictEqual(piles.length, 1);
            assert.strictEqual(piles[0].amount, treeResource.yields[0].amount);
            assert.deepStrictEqual(
                piles[0].position,
                stumpPosition,
                "the stump's own tile is free once the tree is gone, so the timber lands there",
            );
        });

        it("fells with a full hand, since the yields never go there", () => {
            const { root, worker } = createDropScene();
            setHeldItem(
                worker.requireEcsComponent(HeldItemComponentId),
                stoneItem,
                2,
            );

            const result = executeHarvestResourceAction(
                dropChop("resource"),
                worker,
                0,
            );

            assert.strictEqual(
                result.kind,
                "complete",
                "no free-hand detour is planned",
            );
            assert.strictEqual(
                worker.requireEcsComponent(HeldItemComponentId).item?.id,
                stoneItem.id,
                "what it was carrying is untouched",
            );
            assert.strictEqual(groundPiles(root, "wood").length, 1);
        });

        it("applies to gathered resources too, not just felled ones", () => {
            const { root, worker } = createDropScene(mushroomResource);

            const result = executeHarvestResourceAction(
                {
                    type: "harvestResource",
                    entityId: "resource",
                    harvestAction: ResourceHarvestMode.Pick,
                    outputPolicy: OutputPolicy.Drop,
                },
                worker,
                0,
            );

            assert.strictEqual(result.kind, "complete");
            assert.strictEqual(
                worker.requireEcsComponent(HeldItemComponentId).item,
                null,
            );
            assert.strictEqual(
                groundPiles(root, mushroomResource.yields[0].item.id).length,
                1,
            );
        });

        it("retires the production order that sent the worker out", () => {
            const { worker, settlement } = createDropScene();

            const job = createProductionJob("forrester");
            settlement.requireEcsComponent(JobQueueComponentId).jobs.push(job);
            claimJobInQueue(job, worker.id, settlement);

            executeHarvestResourceAction(dropChop("resource"), worker, 0);

            assert.strictEqual(
                settlement.requireEcsComponent(JobQueueComponentId).jobs.length,
                0,
                "the felling is what fills the order, under either policy",
            );
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
            held.item = stoneItem; // tree yields wood, so stone is incompatible
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
            const stockpileComp = createStockpileComponent(200);
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
                        goal: { kind: "adjacent" },
                    },
                    { type: "depositToStockpile", stockpileId: "stockpile" },
                    {
                        type: "moveTo",
                        target: { x: 11, y: 8 },
                        goal: { kind: "adjacent" },
                    },
                ],
            );
        });

        it("drops the held item in place when no stockpile accepts it", () => {
            const { worker } = createSettlementScene();
            // No stockpile added, so nowhere to deposit the stone.

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
                        type: "dropHeld",
                        reason: "Dropped Stone to free hands for harvesting Tree",
                    },
                ],
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

    describe("component invalidation", () => {
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
    });
});
