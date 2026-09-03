import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import { isPointAdjacentTo } from "../../../src/common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    CraftingComponentId,
    CraftingOutputPolicy,
} from "../../../src/game/component/craftingComponent.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import { planksRecipe } from "../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { carpenter } from "../../../src/data/building/wood/carpenter.ts";
import { createCraftingJob } from "../../../src/game/job/craftingJob.ts";
import { getBehaviorAgent } from "../../../src/game/component/behaviorAgentComponent.ts";

/**
 * Worker at (10, 8), carpenter at (11, 8) stocked with the wood for one planks
 * craft, and a stockpile at (15, 8) to haul into.
 */
function craftingYard(): {
    harness: ScenarioHarness;
    building: Entity;
    stockpile: Entity;
    worker: Entity;
} {
    const harness = new ScenarioHarness();
    const building = harness.addCraftingBuilding(
        "carpenter",
        { x: 11, y: 8 },
        carpenter,
    );
    addInventoryItem(
        building.requireEcsComponent(InventoryComponentId),
        woodResourceItem,
        4,
    );
    const stockpile = harness.addStockpile("stockpile", { x: 15, y: 8 });
    const worker = harness.addWorker("worker", { x: 10, y: 8 });
    harness.queueJob(createCraftingJob(building.id, planksRecipe));
    return { harness, building, stockpile, worker };
}

function groundPlanks(root: Entity): Entity | null {
    for (const [pile, collectable] of root.queryComponents(
        CollectableComponentId,
    )) {
        if (!pile.hasComponent(GroundItemComponentId)) continue;
        if (collectable.items.some((stack) => stack.item.id === "planks")) {
            return pile;
        }
    }
    return null;
}

describe("craftAndHaul scenario tests", () => {
    it("hauls the crafted output to a stockpile by default", () => {
        const { harness, building, stockpile, worker } = craftingYard();

        harness.tickUntil(
            () => harness.getItemCount(stockpile, "planks") > 0,
            80,
        );

        assert.ok(
            harness.getItemCount(stockpile, "planks") > 0,
            "the store holds the planks",
        );
        assert.strictEqual(harness.getHeldAmount(worker, "planks"), 0);
        assert.strictEqual(harness.getItemCount(building, "planks"), 0);
        assert.strictEqual(
            harness.getItemCount(building, "wood"),
            0,
            "the craft consumed the wood",
        );
    });

    it("sets the crafted output down beside the bench under the drop policy", () => {
        const { harness, building, stockpile, worker } = craftingYard();
        building.requireEcsComponent(CraftingComponentId).outputPolicy =
            CraftingOutputPolicy.Drop;

        harness.tickUntil(() => groundPlanks(harness.root) !== null, 80);

        const pile = groundPlanks(harness.root);
        assert.ok(pile, "a planks pile lies on the ground");
        assert.ok(
            isPointAdjacentTo(pile.worldPosition, building.worldPosition),
            "the pile lies beside the bench",
        );
        assert.strictEqual(harness.getItemCount(stockpile, "planks"), 0);
        assert.strictEqual(harness.getHeldAmount(worker, "planks"), 0);
    });

    it("restock moves items from surplus stockpile to deficit stockpile", () => {
        /**
         * Stockpile A at (10, 8) has 20 wood, no preference.
         * Stockpile B at (15, 8) has 0 wood, preferred 10.
         * Worker at (12, 8) should select restock and move wood from A to B.
         */
        const harness = new ScenarioHarness();

        const stockpileA = harness.addStockpile("stockpile-a", { x: 10, y: 8 });
        const stockpileB = harness.addStockpile(
            "stockpile-b",
            { x: 15, y: 8 },
            [{ itemId: "wood", amount: 10 }],
        );

        const inventoryA = stockpileA.requireEcsComponent(InventoryComponentId);
        addInventoryItem(inventoryA, woodResourceItem, 20);

        const worker = harness.addWorker("worker", { x: 12, y: 8 });

        harness.tick();

        const agent = getBehaviorAgent(worker);
        assert.strictEqual(
            agent?.currentBehaviorName,
            "restock",
            `Worker should select restock, got: ${agent?.currentBehaviorName}`,
        );

        harness.tickUntil(
            () => harness.getItemCount(stockpileB, "wood") > 0,
            80,
        );

        assert.ok(
            harness.getItemCount(stockpileB, "wood") > 0,
            "Stockpile B should have wood after restock",
        );
        assert.ok(
            harness.getItemCount(stockpileA, "wood") < 20,
            "Stockpile A should have less wood after restock",
        );
    });
});
