import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import type { Point } from "../../../src/common/point.ts";
import { stoneTower } from "../../../src/data/building/stone/tower.ts";
import { cresset } from "../../../src/data/building/light/cresset.ts";
import {
    breadItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../../src/game/component/stationComponent.ts";
import { isManningStation } from "../../../src/game/component/stationQuery.ts";
import { WorkerRole } from "../../../src/game/component/worker/roleComponent.ts";
import { BehaviorAgentComponentId } from "../../../src/game/component/behaviorAgentComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../../src/game/component/heldItemComponent.ts";
import { createCollectableComponent } from "../../../src/game/component/collectableComponent.ts";
import { createGroundItemComponent } from "../../../src/game/component/groundItemComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { HungerComponentId } from "../../../src/game/component/hungerComponent.ts";
import { EnergyComponentId } from "../../../src/game/component/energyComponent.ts";
import { MoveToJob } from "../../../src/game/job/moveToPointJob.ts";
import { JobQueueComponentId } from "../../../src/game/component/jobQueueComponent.ts";
import { setRoles } from "../behavior/behaviorTestHelpers.ts";

const TOWER = { x: 14, y: 12 };

/** A kingdom with a lit yard, a stockpile, and a working tower. */
function guardedYard(): { harness: ScenarioHarness; tower: Entity } {
    const harness = new ScenarioHarness([pathfindingSystem]);
    const kingdom = harness.addPlayerKingdom();
    harness.addPlayerBuilding(kingdom, cresset, { x: 16, y: 12 }, "light");
    harness.addPlayerBuilding(kingdom, stoneTower, TOWER, "tower");
    const tower = harness.root.findEntity("tower")!;
    tower.requireEcsComponent(StationComponentId).priority =
        StationPriority.High;
    harness.addStockpile("store", { x: 18, y: 12 });
    return { harness, tower };
}

/** Put a guard straight onto the post, skipping the walk there. */
function addGuardOnPost(harness: ScenarioHarness, roles: WorkerRole[]): Entity {
    const guard = harness.addWorker("guard", { x: 13, y: 12 });
    setRoles(guard, roles);
    guard.worldPosition = TOWER;
    return guard;
}

function addPile(
    harness: ScenarioHarness,
    id: string,
    position: Point,
): Entity {
    const pile = new Entity(id);
    pile.setEcsComponent(
        createCollectableComponent([{ item: woodResourceItem, amount: 3 }]),
    );
    pile.setEcsComponent(createGroundItemComponent(0));
    harness.root.addChild(pile);
    pile.worldPosition = position;
    return pile;
}

function currentBehavior(entity: Entity): string | null {
    return entity.requireEcsComponent(BehaviorAgentComponentId)
        .currentBehaviorName;
}

function claimedJobCount(harness: ScenarioHarness, worker: Entity): number {
    const queue = harness.root.requireEcsComponent(JobQueueComponentId);
    return queue.jobs.filter((job) => job.claimedBy === worker.id).length;
}

/** Drop everything in the queue, standing in for the work running out. */
function clearJobs(harness: ScenarioHarness): void {
    harness.root.requireEcsComponent(JobQueueComponentId).jobs = [];
}

describe("role priority scenario", () => {
    it("keeps a guard on the wall while work goes undone, when guarding comes first", () => {
        const { harness } = guardedYard();
        const guard = addGuardOnPost(harness, [
            WorkerRole.Guard,
            WorkerRole.Worker,
        ]);
        harness.queueJob(MoveToJob(guard, { x: 20, y: 20 }));

        for (let tick = 0; tick < 12; tick++) {
            harness.tick();
            assert.strictEqual(
                isManningStation(guard),
                true,
                `the guard left the post on tick ${tick} instead of holding it`,
            );
        }
        assert.strictEqual(
            claimedJobCount(harness, guard),
            0,
            "the job was left for someone whose roles allow it sooner",
        );
    });

    it("sends the same guard to work when work comes first, and back afterwards", () => {
        const { harness } = guardedYard();
        const guard = addGuardOnPost(harness, [
            WorkerRole.Worker,
            WorkerRole.Guard,
        ]);
        harness.queueJob(MoveToJob(guard, { x: 20, y: 20 }));

        const leftThePost = harness.tickUntil(
            () => !isManningStation(guard),
            20,
        );
        assert.ok(leftThePost < 20, "the guard climbed down to take the job");
        assert.strictEqual(claimedJobCount(harness, guard), 1);

        clearJobs(harness);

        // Guarding is now the only role with anything behind it.
        harness.tickUntil(() => isManningStation(guard), 60);
        assert.strictEqual(
            isManningStation(guard),
            true,
            "the guard returned to the post once the work ran out",
        );
    });

    it("a worker who hauls and works empties its hands between the two", () => {
        const { harness } = guardedYard();
        const worker = harness.addWorker("worker", { x: 17, y: 12 });
        setRoles(worker, [WorkerRole.Hauler, WorkerRole.Worker]);
        addPile(harness, "pile", { x: 16, y: 13 });

        const store = harness.root.findEntity("store")!;
        harness.tickUntil(
            () => harness.getItemCount(store, woodResourceItem.id) >= 3,
            80,
        );

        assert.strictEqual(
            harness.getItemCount(store, woodResourceItem.id),
            3,
            "the haul reached the stockpile instead of stalling in the worker's hand",
        );
        assert.strictEqual(
            isHeldEmpty(worker.requireEcsComponent(HeldItemComponentId)),
            true,
        );

        // The interaction that breaks if hauling and working fight over the hand.
        harness.queueJob(MoveToJob(worker, { x: 20, y: 20 }));
        harness.tickUntil(() => currentBehavior(worker) === "performJob", 20);
        assert.strictEqual(currentBehavior(worker), "performJob");
    });

    it("a worker with every role excluded does nothing, but still eats", () => {
        const { harness } = guardedYard();
        const worker = harness.addWorker("worker", { x: 17, y: 13 });
        setRoles(worker, []);
        addPile(harness, "pile", { x: 16, y: 13 });
        harness.queueJob(MoveToJob(worker, { x: 20, y: 20 }));

        const store = harness.root.findEntity("store")!;
        addInventoryItem(
            store.requireEcsComponent(InventoryComponentId),
            breadItem,
            5,
        );

        harness.tickN(10);

        assert.strictEqual(
            currentBehavior(worker),
            null,
            "no role was performed",
        );
        assert.strictEqual(
            claimedJobCount(harness, worker),
            0,
            "the job was left unclaimed",
        );
        assert.strictEqual(
            harness.getItemCount(store, woodResourceItem.id),
            0,
            "the pile was left where it lay",
        );

        // Eating is not a role and is not up for exclusion.
        worker.requireEcsComponent(HungerComponentId).hunger = 95;
        harness.tickUntil(() => currentBehavior(worker) === "eat", 10);
        assert.strictEqual(currentBehavior(worker), "eat");
    });

    it("a tired worker with every role excluded still sleeps", () => {
        const { harness } = guardedYard();
        const worker = harness.addWorker("worker", { x: 17, y: 13 });
        setRoles(worker, []);

        const energy = worker.requireEcsComponent(EnergyComponentId);
        energy.energy = 1;

        harness.tickN(2);

        assert.strictEqual(currentBehavior(worker), "sleep");
    });
});
