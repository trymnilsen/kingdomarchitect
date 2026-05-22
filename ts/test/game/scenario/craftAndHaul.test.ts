import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import { planksRecipe } from "../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { carpenter } from "../../../src/data/building/wood/carpenter.ts";
import { createCraftingJob } from "../../../src/game/job/craftingJob.ts";
import { getBehaviorAgent } from "../../../src/game/component/BehaviorAgentComponent.ts";

describe("craftAndHaul scenario tests", () => {
    it("crafted output ends up in the worker's held slot", () => {
        /**
         * Worker at (10, 8). Carpenter at (11, 8) starts with 4 wood already in
         * its inventory (the held-item refactor stages inputs in the building,
         * not the worker). Queue a planks crafting job. After the worker
         * crafts, the planks land in held — not in the building.
         */
        const harness = new ScenarioHarness();
        const building = harness.addCraftingBuilding(
            "carpenter",
            { x: 11, y: 8 },
            carpenter,
        );
        harness.addWorker("worker", { x: 10, y: 8 });

        const buildingInventory =
            building.requireEcsComponent(InventoryComponentId);
        addInventoryItem(buildingInventory, woodResourceItem, 4);

        harness.queueJob(createCraftingJob(building.id, planksRecipe));

        const worker = harness.root.findEntity("worker")!;
        const ticks = harness.tickUntil(
            () => harness.getHeldAmount(worker, "planks") > 0,
            50,
        );

        assert.ok(
            harness.getHeldAmount(worker, "planks") > 0,
            `Worker should have planks in held after crafting (elapsed: ${ticks} ticks)`,
        );
        assert.strictEqual(
            harness.getItemCount(building, "planks"),
            0,
            "Building should NOT have planks",
        );
        assert.strictEqual(
            harness.getItemCount(building, "wood"),
            0,
            "Building should have consumed its wood",
        );
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
