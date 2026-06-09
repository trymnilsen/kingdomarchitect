import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import {
    InventoryComponentId,
    addInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import { BehaviorAgentComponentId } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { HungerComponentId } from "../../../src/game/component/hungerComponent.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { wheatResourceItem } from "../../../src/data/inventory/items/resources.ts";

/**
 * End-to-end coverage for the replanning refactor's two headline behaviors:
 *
 *  1. An idle worker recovers from idle on its own — the bug that motivated the
 *     work. Pre-fix, a worker with nothing valid to do cleared pendingReplan and
 *     an empty queue and then sat frozen, never noticing a rising need. Now the
 *     empty queue itself drives re-selection each tick, with no external poke.
 *
 *  2. A busy worker is NOT interrupted by a rising need. Needs only influence the
 *     next selection at a plan boundary; a worker mid-plan runs that plan to
 *     completion. Only explicit/imperative events (damage, command) preempt.
 */
function addTree(harness: ScenarioHarness, position: { x: number; y: number }): Entity {
    const tree = new Entity("tree");
    tree.setEcsComponent(createResourceComponent("tree1"));
    tree.setEcsComponent(createHealthComponent(10, 10));
    harness.root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

describe("needs and plan-commitment scenario tests", () => {
    it("an idle worker recovers from idle to eat when it gets hungry, with no external poke", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 12, y: 8 });
        // Stockpile off the worker's path, stocked with food so eat is satisfiable.
        const stockpile = harness.addStockpile("stockpile", { x: 15, y: 8 });
        addInventoryItem(
            stockpile.getEcsComponent(InventoryComponentId)!,
            wheatResourceItem,
            3,
        );

        const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;
        const hunger = worker.getEcsComponent(HungerComponentId)!;

        // Let the worker settle into idle: no jobs, not hungry, fully rested, so
        // nothing is valid. Pre-fix this is a terminal "stuck" state — empty queue
        // and pendingReplan cleared, with nothing left to re-arm it.
        harness.tickN(3);
        assert.strictEqual(
            agent.currentBehaviorName,
            null,
            "worker should be idle (no behavior)",
        );
        assert.strictEqual(
            agent.actionQueue.length,
            0,
            "idle worker should have an empty action queue",
        );
        assert.strictEqual(
            agent.pendingReplan,
            undefined,
            "settled idle worker must not carry a pending replan (keeps it displaceable)",
        );

        // It gets hungry. Nothing pokes the behavior agent — the empty-queue rule
        // must re-select on its own and pick eat.
        hunger.hunger = 45; // >= HUNGER_THRESHOLD (40)
        worker.invalidateComponent(HungerComponentId);

        harness.tickUntil(() => hunger.hunger < 45, 40);

        assert.ok(
            hunger.hunger < 45,
            "idle worker should have re-selected on its own, walked to food, and eaten",
        );
        assert.strictEqual(
            harness.getItemCount(stockpile, "wheat"),
            2,
            "worker should have withdrawn exactly one wheat from the stockpile to eat",
        );
    });

    it("does not abandon a job for a rising need mid-plan", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        // Food is available, so eat is a fully viable competitor — the worker
        // staying on the job proves commitment, not a lack of reachable food.
        const stockpile = harness.addStockpile("stockpile", { x: 10, y: 11 });
        addInventoryItem(
            stockpile.getEcsComponent(InventoryComponentId)!,
            wheatResourceItem,
            5,
        );

        // A tree far to the east, so the worker spends many ticks walking — it is
        // unambiguously mid-plan for the whole window the test inspects.
        const tree = addTree(harness, { x: 30, y: 8 });
        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;
        const hunger = worker.getEcsComponent(HungerComponentId)!;

        // Let the worker claim the job and start walking toward the tree.
        harness.tickN(3);
        assert.strictEqual(
            agent.currentBehaviorName,
            "performJob",
            "worker should have claimed the job and be walking to it",
        );
        const xBeforeSpike = worker.worldPosition.x;

        // Spike hunger so eat's utility (~60) outranks performJob's (50). If a
        // rising need could interrupt a running plan, the worker would drop the
        // walk here and head for food instead.
        hunger.hunger = 70;
        worker.invalidateComponent(HungerComponentId);

        // Over the next several ticks the worker keeps working the job and never
        // switches to eat while its plan is in flight.
        for (let i = 0; i < 8; i++) {
            harness.tick();
            assert.strictEqual(
                agent.currentBehaviorName,
                "performJob",
                `worker must stay on its job mid-plan (post-spike tick ${i}); needs do not interrupt`,
            );
        }

        assert.ok(
            worker.worldPosition.x > xBeforeSpike,
            "worker should have kept walking toward the job, not turned back for food",
        );
        assert.strictEqual(
            hunger.hunger,
            70,
            "worker should not have eaten mid-plan (hunger unchanged)",
        );
    });
});
