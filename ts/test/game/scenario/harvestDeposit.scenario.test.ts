import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";

/**
 * End-to-end check that a player worker delivers a harvested yield to a
 * stockpile instead of dropping it on the ground. With the empty-hand claim
 * gate, a worker holding the yield can no longer grab the next job and
 * panic-drop its load; DepositHeldBehavior wins and hauls it to the stockpile.
 */
function addTree(harness: ScenarioHarness, position = { x: 13, y: 8 }): Entity {
    const tree = new Entity("tree");
    tree.setEcsComponent(createResourceComponent("tree1"));
    tree.setEcsComponent(createHealthComponent(10, 10));
    harness.root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

function groundPileCount(harness: ScenarioHarness): number {
    return harness.root.queryComponents(GroundItemComponentId).size;
}

describe("harvest-deposit scenario tests", () => {
    it("delivers a harvested yield to the stockpile rather than the ground", () => {
        const harness = new ScenarioHarness();
        const stockpile = harness.addStockpile("stockpile", { x: 15, y: 8 });
        const worker = harness.addWorker("worker", { x: 12, y: 8 });
        const tree = addTree(harness);

        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        harness.tickUntil(() => harness.getItemCount(stockpile, "wood") > 0, 60);

        assert.ok(
            harness.getItemCount(stockpile, "wood") > 0,
            "stockpile should receive the harvested wood",
        );
        assert.strictEqual(
            harness.getHeldAmount(worker, "wood"),
            0,
            "worker should no longer be carrying the wood",
        );
        assert.strictEqual(
            groundPileCount(harness),
            0,
            "no wood should have been dropped on the ground",
        );
    });

    it("idles holding the yield when no stockpile can accept it", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 12, y: 8 });
        const tree = addTree(harness);

        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        // Let it harvest, then keep ticking to confirm it neither drops the
        // load nor thrashes — the gate keeps it from claiming further work.
        harness.tickUntil(() => harness.getHeldAmount(worker, "wood") > 0, 60);
        harness.tickN(10);

        assert.ok(
            harness.getHeldAmount(worker, "wood") > 0,
            "worker should still be holding the harvested wood",
        );
        assert.strictEqual(
            groundPileCount(harness),
            0,
            "worker should not litter when there is nowhere to deposit",
        );
    });
});
