import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { createInventorySpillSystem } from "../../../src/game/system/inventorySpillSystem.ts";
import { GameTime } from "../../../src/game/gameTime.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { damageEntity } from "../../../src/game/component/healthComponent.ts";
import {
    CollectableComponentId,
    createCollectableComponent,
} from "../../../src/game/component/collectableComponent.ts";
import {
    createGroundItemComponent,
    GroundItemComponentId,
} from "../../../src/game/component/groundItemComponent.ts";
import { JobQueueComponentId } from "../../../src/game/component/jobQueueComponent.ts";
import { collectJobsForEntity } from "../../../src/game/job/collectJobsForEntity.ts";
import { CollectItemJob } from "../../../src/game/job/collectItemJob.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import {
    ironOreItem,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

function groundPiles(root: Entity): Entity[] {
    const piles: Entity[] = [];
    for (const [entity] of root.queryComponents(GroundItemComponentId)) {
        piles.push(entity);
    }
    return piles;
}

function groundAmount(root: Entity, itemId: string): number {
    let total = 0;
    for (const pile of groundPiles(root)) {
        const collectable = pile.requireEcsComponent(CollectableComponentId);
        for (const stack of collectable.items) {
            if (stack.item.id === itemId) total += stack.amount;
        }
    }
    return total;
}

describe("spill and haul scenario", () => {
    it("hauls a destroyed store's spilled goods back into a new stockpile", () => {
        const harness = new ScenarioHarness([
            pathfindingSystem,
            createInventorySpillSystem(new GameTime()),
        ]);

        const doomed = harness.addStockpile("doomed", { x: 14, y: 12 });
        const inventory = doomed.requireEcsComponent(InventoryComponentId);
        addInventoryItem(inventory, woodResourceItem, 5);
        addInventoryItem(inventory, stoneResource, 4);

        // A replacement store to haul into, and workers to do the hauling.
        harness.addStockpile("replacement", { x: 20, y: 12 });
        harness.addWorker("worker-a", { x: 18, y: 15 });
        harness.addWorker("worker-b", { x: 19, y: 16 });

        damageEntity(doomed, 1000, harness.currentTick);

        assert.strictEqual(groundAmount(harness.root, "wood"), 5);
        assert.strictEqual(groundAmount(harness.root, "stone"), 4);

        for (const pile of groundPiles(harness.root)) {
            for (const job of collectJobsForEntity(harness.root, pile)) {
                harness.queueJob(job);
            }
        }

        const replacement = harness.root.findEntity("replacement")!;
        harness.tickUntil(
            () =>
                harness.getItemCount(replacement, "wood") === 5 &&
                harness.getItemCount(replacement, "stone") === 4,
            120,
        );

        assert.strictEqual(
            groundPiles(harness.root).length,
            0,
            "the yard is cleared",
        );
        assert.strictEqual(harness.getItemCount(replacement, "wood"), 5);
        assert.strictEqual(harness.getItemCount(replacement, "stone"), 4);
    });

    it("lets separate workers take separate piles at the same time", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);

        // Four piles sharing one tile, as a spill leaves them.
        const tile = { x: 16, y: 12 };
        const items = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
        ];
        for (const item of items) {
            const pile = new Entity(`pile-${item.id}`);
            pile.setEcsComponent(
                createCollectableComponent([{ item, amount: 2 }]),
            );
            pile.setEcsComponent(createGroundItemComponent(0));
            harness.root.addChild(pile);
            pile.worldPosition = tile;
            harness.queueJob(CollectItemJob(pile, item.id));
        }

        harness.addStockpile("store", { x: 20, y: 12 });
        harness.addWorker("worker-a", { x: 17, y: 14 });
        harness.addWorker("worker-b", { x: 18, y: 14 });
        harness.addWorker("worker-c", { x: 19, y: 14 });

        const queue = harness.root.requireEcsComponent(JobQueueComponentId);
        // Measured on the first tick: by tick four the short hauls have already
        // completed and the queue would look serial in hindsight.
        harness.tick();

        const claimers = new Set(
            queue.jobs
                .filter((job) => job.id === "collectItem" && job.claimedBy)
                .map((job) => job.claimedBy),
        );
        assert.ok(
            claimers.size > 1,
            `piles on one tile are hauled in parallel, saw ${claimers.size} worker(s) claiming`,
        );
    });
});
