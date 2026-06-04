import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { pointEquals, type Point } from "../../../src/common/point.ts";
import { isImpassableStructure } from "../../../src/game/component/traversalComponent.ts";
import { queryEntity } from "../../../src/game/map/query/queryEntity.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import { EnergyComponentId } from "../../../src/game/component/energyComponent.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { woodenHouse } from "../../../src/data/building/wood/house.ts";
import { createStepOutsideBehavior } from "../../../src/game/behavior/behaviors/StepOutsideBehavior.ts";
import { Entity } from "../../../src/game/entity/entity.ts";

/**
 * StepOutsideBehavior keeps workers from getting stranded on top of buildings.
 *
 * A worker `stepOnto`s a building to sleep in it or operate it, but nothing used
 * to bring them back down: any follow-up action that only needs to be *adjacent*
 * to its target is satisfied from the building's own tile, so the worker would
 * keep working from the rooftop, and a failed on-building action left them stuck
 * there. This behaviour has high utility whenever a worker stands on an impassable
 * building and expands to a single `stepOff`, so the worker grounds itself the
 * moment it has no plan that keeps it up there.
 *
 * These run the real system pipeline (behaviour selection + action execution) via
 * the harness, so they exercise the actual resolver wiring, not the action alone.
 */

/** True when the entity currently shares a tile with an impassable building. */
function isOnBuilding(harness: ScenarioHarness, entity: Entity): boolean {
    return queryEntity(harness.root, entity.worldPosition).some((occupant) =>
        isImpassableStructure(occupant),
    );
}

function addTree(harness: ScenarioHarness, position: Point): Entity {
    const tree = new Entity("tree");
    tree.setEcsComponent(createResourceComponent("tree1"));
    tree.setEcsComponent(createHealthComponent(10, 10));
    harness.root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

describe("step-outside scenario tests", () => {
    it("grounds a worker left standing on a building", () => {
        const harness = new ScenarioHarness();
        harness.placeBuilding("stockpile", { x: 12, y: 10 });
        // Worker is mounted on the building tile, as it would be after stepOnto.
        const worker = harness.addWorker("worker", { x: 12, y: 10 });

        harness.tickUntil(() => !isOnBuilding(harness, worker), 10);

        // First free cardinal neighbour (adjacentPoints order: left, right, ...).
        assert.deepStrictEqual(
            worker.worldPosition,
            { x: 11, y: 10 },
            `worker should step onto the adjacent ground tile, was ${JSON.stringify(
                worker.worldPosition,
            )}`,
        );
    });

    it("does not work from the rooftop — steps off before doing an adjacent job", () => {
        const harness = new ScenarioHarness();
        harness.placeBuilding("stockpile", { x: 12, y: 10 });
        const worker = harness.addWorker("worker", { x: 12, y: 10 });
        // Tree is cardinally adjacent to the building the worker stands on, so a
        // worker left on the rooftop is already "adjacent" and could chop without
        // moving. stepOutside must win first and ground the worker.
        const tree = addTree(harness, { x: 13, y: 10 });
        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        harness.tickUntil(() => !isOnBuilding(harness, worker), 60);

        // At the moment the worker leaves the building the tree must be untouched.
        // If stepOutside did not outrank performJob, the worker would have chopped
        // from the rooftop and the tree would be damaged or already gone by now.
        const liveTree = harness.root.findEntity("tree");
        const health = liveTree?.getEcsComponent(HealthComponentId);
        assert.ok(
            health !== undefined && health.currentHp === health.maxHp,
            "tree must be at full health when the worker steps off — it must not work from the rooftop",
        );
    });

    it("sleeps in its assigned house, then steps outside on waking", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 15, y: 10 });
        const house = harness.placeBuilding(
            "house",
            { x: 12, y: 10 },
            { building: woodenHouse, housing: true, tenant: worker },
        );

        // Make the worker tired enough that SleepBehavior takes over.
        const energy = worker.getEcsComponent(EnergyComponentId)!;
        energy.energy = 10;
        worker.invalidateComponent(EnergyComponentId);

        // It should walk to the house and step onto it to sleep "inside".
        const mountedIn = harness.tickUntil(
            () => isOnBuilding(harness, worker),
            60,
        );
        assert.ok(
            isOnBuilding(harness, worker),
            `worker should mount the house to sleep (gave up after ${mountedIn} ticks)`,
        );
        assert.ok(pointEquals(worker.worldPosition, house.worldPosition));

        // Once rested it must step back outside rather than linger on the house.
        harness.tickUntil(
            () => energy.energy >= 90 && !isOnBuilding(harness, worker),
            120,
        );
        assert.ok(
            energy.energy >= 90,
            `worker should have slept and restored energy, was ${energy.energy}`,
        );
        assert.ok(
            !isOnBuilding(harness, worker),
            "worker should step outside after waking, not stay on the house",
        );
    });

    it("waits in place while boxed in, then steps off once a side frees", () => {
        const harness = new ScenarioHarness();
        const center: Point = { x: 12, y: 10 };
        const building = harness.placeBuilding("center", center);
        const worker = harness.addWorker("worker", center);

        // Surround all four cardinal neighbours with impassable buildings.
        harness.placeBuilding("n", { x: 12, y: 9 });
        harness.placeBuilding("s", { x: 12, y: 11 });
        harness.placeBuilding("w", { x: 11, y: 10 });
        const east = harness.placeBuilding("e", { x: 13, y: 10 });

        harness.tickN(5);
        assert.ok(
            pointEquals(worker.worldPosition, building.worldPosition),
            "worker should wait on the building while every side is blocked",
        );

        // Free the east tile — the still-running stepOff should now resolve.
        harness.root.removeChild(east);
        harness.tickN(3);

        assert.deepStrictEqual(
            worker.worldPosition,
            { x: 13, y: 10 },
            "worker should step onto the freed tile",
        );
    });

    it("self-terminates: a grounded worker does not flip back onto the building", () => {
        const harness = new ScenarioHarness();
        harness.placeBuilding("stockpile", { x: 12, y: 10 });
        const worker = harness.addWorker("worker", { x: 12, y: 10 });

        harness.tickUntil(() => !isOnBuilding(harness, worker), 10);
        const grounded = { ...worker.worldPosition };
        harness.tickN(10);

        assert.deepStrictEqual(
            worker.worldPosition,
            grounded,
            "worker should settle off the building, not oscillate back on",
        );
        assert.ok(!isOnBuilding(harness, worker));
    });

    it("is valid only while on a building, and expands to a single stepOff", () => {
        const harness = new ScenarioHarness();
        harness.placeBuilding("stockpile", { x: 12, y: 10 });
        const onBuilding = harness.addWorker("on", { x: 12, y: 10 });
        const onGround = harness.addWorker("off", { x: 15, y: 10 });
        const behavior = createStepOutsideBehavior();

        assert.ok(
            behavior.isValid(onBuilding),
            "valid when standing on the building",
        );
        assert.ok(
            !behavior.isValid(onGround),
            "invalid when standing on open ground",
        );
        assert.deepStrictEqual(behavior.expand(onBuilding), [
            { type: "stepOff" },
        ]);
    });
});
