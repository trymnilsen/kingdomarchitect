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
    it("crafted output goes to worker inventory", () => {
        /**
         * Worker at (10, 8) adjacent to carpenter at (11, 8).
         * Queue a planks crafting job. After completion, planks should
         * be in the worker's inventory, not the building's.
         */
        const harness = new ScenarioHarness();
        const building = harness.addCraftingBuilding(
            "carpenter",
            { x: 11, y: 8 },
            carpenter,
        );
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        harness.addStockpile("stockpile", { x: 14, y: 8 });

        // Give worker the materials (planks recipe needs 4 wood)
        const workerInventory = worker.requireEcsComponent(InventoryComponentId);
        addInventoryItem(workerInventory, woodResourceItem, 10);

        // Queue the crafting job
        harness.queueJob(createCraftingJob(building.id, planksRecipe));

        // Run until plank appears in worker inventory (planksRecipe duration: 3)
        const ticks = harness.tickUntil(
            () => harness.getItemCount(worker, "planks") > 0,
            50,
        );

        assert.ok(
            harness.getItemCount(worker, "planks") > 0,
            `Worker should have planks after crafting (elapsed: ${ticks} ticks)`,
        );
        assert.strictEqual(
            harness.getItemCount(building, "planks"),
            0,
            "Building should NOT have planks",
        );
    });

    it("worker self-hauls when inventory is pressured", () => {
        /**
         * Worker starts near-full (18 wood). Stockpile is nearby.
         * Haul behavior utility should spike above other behaviors,
         * causing the worker to deposit items.
         */
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        const stockpile = harness.addStockpile("stockpile", { x: 12, y: 8 });

        const workerInventory = worker.requireEcsComponent(InventoryComponentId);
        addInventoryItem(workerInventory, woodResourceItem, 18);

        // Tick once to let behavior selection happen
        harness.tick();

        const agent = getBehaviorAgent(worker);
        assert.ok(agent, "Worker should have behavior agent");
        assert.strictEqual(
            agent?.currentBehaviorName,
            "haul",
            `Worker should select haul behavior with near-full inventory, got: ${agent?.currentBehaviorName}`,
        );

        // Run until worker's inventory is empty (items deposited)
        harness.tickUntil(() => harness.getItemCount(worker, "wood") === 0, 80);

        assert.ok(
            harness.getItemCount(stockpile, "wood") > 0,
            "Items should be in the stockpile after hauling",
        );
    });

    it("restock moves items from surplus stockpile to deficit stockpile", () => {
        /**
         * Stockpile A at (10, 8) has 20 wood, no preference.
         * Stockpile B at (15, 8) has 0 wood, preferred 10.
         * Worker at (12, 8) should select restock and move wood from A to B.
         */
        const harness = new ScenarioHarness();

        const stockpileA = harness.addStockpile(
            "stockpile-a",
            { x: 10, y: 8 },
        );
        const stockpileB = harness.addStockpile(
            "stockpile-b",
            { x: 15, y: 8 },
            [{ itemId: "wood", amount: 10 }],
        );

        const inventoryA = stockpileA.requireEcsComponent(InventoryComponentId);
        addInventoryItem(inventoryA, woodResourceItem, 20);

        const worker = harness.addWorker("worker", { x: 12, y: 8 });

        // Tick once to let behavior selection happen
        harness.tick();

        const agent = getBehaviorAgent(worker);
        assert.strictEqual(
            agent?.currentBehaviorName,
            "restock",
            `Worker should select restock, got: ${agent?.currentBehaviorName}`,
        );

        // Run until stockpile B has wood
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

    /**
     * TODO: Full crafting → haul → restock pipeline
     *
     * Expected flow:
     * 1. Forester stockpile has wood
     * 2. Carpenter building has plank recipe
     * 3. Worker claims crafting job, walks to stockpile to fetch wood, crafts planks
     * 4. Planks land in worker inventory
     * 5. Worker hauls (high inventory pressure) to nearest stockpile
     * 6. A restock behavior balances planks to a stockpile with a preferred amount set
     *
     * This multi-phase test requires either multiple workers or multiple tick-phases
     * and is deferred until the full job-planning behavior is wired into the harness.
     */
});
