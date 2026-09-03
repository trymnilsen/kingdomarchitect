import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { executeCraftItemAction } from "../../../../src/game/behavior/actions/craftItemAction.ts";
import { planksRecipe } from "../../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/actionData.ts";
import {
    CraftingComponentId,
    CraftingOutputPolicy,
} from "../../../../src/game/component/craftingComponent.ts";
import { CollectableComponentId } from "../../../../src/game/component/collectableComponent.ts";
import { createTileComponent } from "../../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import { buildingPrefab } from "../../../../src/game/prefab/buildingPrefab.ts";
import { carpenter } from "../../../../src/data/building/wood/carpenter.ts";
import { isPointAdjacentTo } from "../../../../src/common/point.ts";
import { createMinimalWorld } from "../../testWorld.ts";

type CraftItemAction = Extract<BehaviorActionData, { type: "craftItem" }>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 11, y: 8 };

    worker.setEcsComponent(createHeldItemComponent());
    building.setEcsComponent(createInventoryComponent());

    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("craftItemAction", () => {
    it("consumes inputs from the building on first tick", () => {
        const { worker, building } = createTestScene();

        const buildingInventory =
            building.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(buildingInventory, woodResourceItem, 10);

        const action: CraftItemAction = {
            type: "craftItem",
            buildingId: "building",
            recipe: planksRecipe,
        };

        executeCraftItemAction(action, worker, 0);

        assert.strictEqual(action.inputsConsumed, true);

        const wood = getInventoryItem(buildingInventory, "wood");
        assert.strictEqual(wood?.amount, 6); // 10 - 4 consumed
    });

    it("does not consume inputs again on subsequent ticks", () => {
        const { worker, building } = createTestScene();

        const buildingInventory =
            building.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(buildingInventory, woodResourceItem, 10);

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
            inputsConsumed: true,
            progress: 1,
        };

        executeCraftItemAction(action, worker, 0);

        const wood = getInventoryItem(buildingInventory, "wood");
        assert.strictEqual(wood?.amount, 10);
    });

    it("tracks progress on action object", () => {
        const { worker, building } = createTestScene();

        const buildingInventory =
            building.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(buildingInventory, woodResourceItem, 10);

        const action: CraftItemAction = {
            type: "craftItem",
            buildingId: "building",
            recipe: planksRecipe,
        };

        executeCraftItemAction(action, worker, 0);
        assert.strictEqual(action.progress, 1);
    });

    it("completes and outputs to held when progress reaches duration", () => {
        const { worker } = createTestScene();

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
            inputsConsumed: true,
            progress: 2,
        };

        const result = executeCraftItemAction(action, worker, 0);
        assert.strictEqual(result.kind, "complete");

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.strictEqual(held.item?.id, "planks");
        assert.strictEqual(held.amount, 2);
    });

    describe("drop output policy", () => {
        const finishedCraft = {
            type: "craftItem" as const,
            buildingId: "bench",
            recipe: planksRecipe,
            inputsConsumed: true,
            progress: planksRecipe.duration - 1,
        };

        /** A carpenter standing in the chunk map, with the worker on its tile as after stepOnto. */
        function benchWithWorker(root: Entity): {
            worker: Entity;
            bench: Entity;
        } {
            const bench = buildingPrefab(carpenter, false, "bench");
            bench.requireEcsComponent(CraftingComponentId).outputPolicy =
                CraftingOutputPolicy.Drop;
            root.addChild(bench);
            bench.worldPosition = { x: 11, y: 8 };

            const worker = new Entity("worker");
            worker.setEcsComponent(createHeldItemComponent());
            root.addChild(worker);
            worker.worldPosition = bench.worldPosition;
            return { worker, bench };
        }

        function groundPlanks(root: Entity): Entity | null {
            for (const [pile, collectable] of root.queryComponents(
                CollectableComponentId,
            )) {
                if (collectable.items.some((s) => s.item.id === "planks")) {
                    return pile;
                }
            }
            return null;
        }

        it("sets the output on the ground beside the bench, leaving the hand empty", () => {
            const { root } = createMinimalWorld();
            const { worker, bench } = benchWithWorker(root);

            const result = executeCraftItemAction(
                { ...finishedCraft },
                worker,
                7,
            );
            assert.strictEqual(result.kind, "complete");

            const pile = groundPlanks(root);
            assert.ok(pile, "a planks pile lies on the ground");
            assert.ok(
                isPointAdjacentTo(pile.worldPosition, bench.worldPosition),
                "the pile lies beside the bench, never on it",
            );
            assert.strictEqual(
                worker.requireEcsComponent(HeldItemComponentId).amount,
                0,
            );
        });

        it("falls back to held when no tile nearby can take the output", () => {
            // An empty tile component makes every tile unwalkable, so the
            // drop search finds nowhere within reach.
            const root = new Entity("root");
            root.setEcsComponent(createTileComponent());
            root.setEcsComponent(createChunkMapComponent());
            const { worker } = benchWithWorker(root);

            const result = executeCraftItemAction(
                { ...finishedCraft },
                worker,
                7,
            );
            assert.strictEqual(result.kind, "complete");

            assert.strictEqual(groundPlanks(root), null);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            assert.strictEqual(held.item?.id, "planks");
            assert.strictEqual(held.amount, 2);
        });
    });

    it("fails if the building lacks required materials", () => {
        const { worker } = createTestScene();

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker, 0);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if the building has insufficient materials", () => {
        const { worker, building } = createTestScene();

        const buildingInventory =
            building.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(buildingInventory, woodResourceItem, 2);

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker, 0);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if building entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "craftItem" as const,
            buildingId: "nonexistent",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker, 0);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to building", () => {
        const { worker, building } = createTestScene();
        building.worldPosition = { x: 25, y: 25 };

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker, 0);
        assert.strictEqual(result.kind, "failed");
    });
});
