import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import { forrester } from "../../../src/data/building/wood/forrester.ts";
import { forresterProduction } from "../../../src/data/production/productionDefinition.ts";
import { snowTreeResource } from "../../../src/data/inventory/items/naturalResource.ts";
import { ResourceComponentId } from "../../../src/game/component/resourceComponent.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import { JobQueueComponentId } from "../../../src/game/component/jobQueueComponent.ts";
import {
    OutputPolicy,
    OutputPolicyComponentId,
} from "../../../src/game/component/outputPolicyComponent.ts";
import { createProductionJob } from "../../../src/game/job/productionJob.ts";

const forresterPosition = { x: 20, y: 12 };
const woodPerSnowTree = snowTreeResource.yields[0].amount;

/**
 * Ticks to run on after the timber lands, long enough for the worker to have
 * started and finished another felling. An order that fails to retire itself
 * shows up as extra wood by the end of this.
 */
const SETTLE_TICKS = 60;

/**
 * A forrester in a snow biome with its zone stocked to the safety floor, so
 * every order is a planting and a felling rather than a planting alone.
 */
function snowForest(): {
    harness: ScenarioHarness;
    building: Entity;
    stockpile: Entity;
    worker: Entity;
    seeded: Point[];
} {
    const harness = new ScenarioHarness();
    harness.setBiome("snow");

    const building = harness.placeBuilding("forrester", forresterPosition, {
        building: forrester,
    });
    const stockpile = harness.addStockpile("stockpile", { x: 14, y: 12 });
    const worker = harness.addWorker("worker", { x: 16, y: 12 });

    // floor is floor(0.4 * 12) = 4 tiles of the radius-2 diamond.
    const seeded: Point[] = [
        { x: 18, y: 12 },
        { x: 22, y: 12 },
        { x: 20, y: 10 },
        { x: 20, y: 14 },
    ];
    for (const position of seeded) {
        harness.addResource(snowTreeResource, position);
    }

    return { harness, building, stockpile, worker, seeded };
}

/** Every tree standing in the forrester's radius-2 diamond zone. */
function zoneTrees(harness: ScenarioHarness): Entity[] {
    const trees: Entity[] = [];
    for (const [entity] of harness.root.queryComponents(ResourceComponentId)) {
        const dx = entity.worldPosition.x - forresterPosition.x;
        const dy = entity.worldPosition.y - forresterPosition.y;
        if (Math.abs(dx) + Math.abs(dy) <= forresterProduction.zoneRadius) {
            trees.push(entity);
        }
    }
    return trees;
}

/** Total wood lying on the ground anywhere in the world. */
function groundWood(root: Entity): number {
    let total = 0;
    for (const [pile, collectable] of root.queryComponents(
        CollectableComponentId,
    )) {
        if (!pile.hasComponent(GroundItemComponentId)) continue;
        for (const stack of collectable.items) {
            if (stack.item.id === "wood") {
                total += stack.amount;
            }
        }
    }
    return total;
}

function queuedJobCount(harness: ScenarioHarness): number {
    return harness.root.requireEcsComponent(JobQueueComponentId).jobs.length;
}

function samePoint(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
}

describe("forester scenario tests", () => {
    it("fills one order with one tree's worth of timber, then stops", () => {
        const { harness, stockpile } = snowForest();

        harness.queueJob(createProductionJob("forrester"));

        harness.tickUntil(
            () => harness.getItemCount(stockpile, "wood") > 0,
            300,
        );
        harness.tickN(SETTLE_TICKS);

        assert.strictEqual(
            harness.getItemCount(stockpile, "wood"),
            woodPerSnowTree,
            "one order takes one tree and no more",
        );
        assert.strictEqual(
            queuedJobCount(harness),
            0,
            "the felling retired the order",
        );
    });

    it("scales the timber with the number of orders queued", () => {
        const { harness, stockpile } = snowForest();

        harness.queueJob(createProductionJob("forrester"));
        harness.queueJob(createProductionJob("forrester"));

        harness.tickUntil(
            () =>
                harness.getItemCount(stockpile, "wood") >= 2 * woodPerSnowTree,
            600,
        );
        harness.tickN(SETTLE_TICKS);

        assert.strictEqual(
            harness.getItemCount(stockpile, "wood"),
            2 * woodPerSnowTree,
            "two orders take exactly two trees",
        );
        assert.strictEqual(queuedJobCount(harness), 0);
    });

    /**
     * Checked as the sapling appears rather than after the run settles. A
     * worker will fell a tree that blocks its path, the zone's own saplings
     * included, so no count in the zone survives to the end of a run.
     */
    it("plants the biome's own tree as part of the order", () => {
        const { harness, seeded } = snowForest();
        const isNew = (tree: Entity) =>
            !seeded.some((p) => samePoint(p, tree.worldPosition));

        harness.queueJob(createProductionJob("forrester"));
        harness.tickUntil(() => zoneTrees(harness).some(isNew), 300);

        const planted = zoneTrees(harness).find(isNew);
        assert.ok(planted, "the order put a new tree in the zone");
        assert.strictEqual(
            planted.requireEcsComponent(ResourceComponentId).resourceId,
            snowTreeResource.id,
            "a forrester in the snow plants snow trees",
        );
    });

    it("sends the timber to the ground instead of the store under the drop policy", () => {
        const { harness, building, stockpile, worker } = snowForest();
        building.requireEcsComponent(OutputPolicyComponentId).policy =
            OutputPolicy.Drop;

        harness.queueJob(createProductionJob("forrester"));
        harness.tickUntil(() => queuedJobCount(harness) === 0, 300);
        harness.tickN(SETTLE_TICKS);

        assert.ok(
            groundWood(harness.root) >= woodPerSnowTree,
            "a tree's worth of timber is lying about",
        );
        assert.strictEqual(
            harness.getHeldAmount(worker, "wood"),
            0,
            "the feller never picked it up",
        );
        assert.strictEqual(
            harness.getItemCount(stockpile, "wood"),
            0,
            "and carried none of it to the store, which is the whole difference from hauling",
        );
    });
});
