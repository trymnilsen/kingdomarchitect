import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { collectJobsForEntity } from "../../../src/game/job/collectJobsForEntity.ts";
import { createCollectableComponent } from "../../../src/game/component/collectableComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import {
    addJob,
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

function createScene() {
    const root = new Entity("root");
    const kingdom = new Entity("kingdom");
    kingdom.setEcsComponent(createPlayerKingdomComponent());
    kingdom.setEcsComponent(createJobQueueComponent());
    root.addChild(kingdom);

    const building = new Entity("workshop");
    building.setEcsComponent(
        createCollectableComponent([
            { item: woodResourceItem, amount: 4 },
            { item: stoneResource, amount: 2 },
        ]),
    );
    kingdom.addChild(building);
    building.worldPosition = { x: 14, y: 11 };

    const queue = kingdom.requireEcsComponent(JobQueueComponentId);
    return { root, kingdom, building, queue };
}

describe("collectJobsForEntity", () => {
    it("queues one job per output type", () => {
        const { root, building } = createScene();

        const jobs = collectJobsForEntity(root, building);

        // A worker hauls one item type per trip, so two outputs are two jobs.
        // One job would haul one type and strand the other.
        assert.strictEqual(jobs.length, 2);
        assert.deepStrictEqual(
            jobs.map((job) => job.itemId).sort(),
            [stoneResource.id, woodResourceItem.id].sort(),
        );
        for (const job of jobs) {
            assert.strictEqual(job.entityId, "workshop");
        }
    });

    it("skips stacks that already have a job waiting", () => {
        const { root, building, queue } = createScene();

        for (const job of collectJobsForEntity(root, building)) {
            addJob(queue, job);
        }
        const secondTap = collectJobsForEntity(root, building);

        assert.strictEqual(
            secondTap.length,
            0,
            "tapping Collect twice must not double the work",
        );
    });

    it("still queues the types that have no job yet", () => {
        const { root, building, queue } = createScene();

        const [first] = collectJobsForEntity(root, building);
        addJob(queue, first);

        const remaining = collectJobsForEntity(root, building);

        assert.strictEqual(remaining.length, 1);
        assert.notStrictEqual(remaining[0].itemId, first.itemId);
    });

    it("returns nothing for an entity with no collectable", () => {
        const { root, kingdom } = createScene();
        const plain = new Entity("plain");
        kingdom.addChild(plain);

        assert.deepStrictEqual(collectJobsForEntity(root, plain), []);
    });
});
