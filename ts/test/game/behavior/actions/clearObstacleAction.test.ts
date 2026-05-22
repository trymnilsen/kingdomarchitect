import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../../testWorld.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../../../src/game/component/heldItemComponent.ts";
import { createResourceComponent } from "../../../../src/game/component/resourceComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../src/game/component/collectableComponent.ts";
import { executeClearObstacleAction } from "../../../../src/game/behavior/actions/clearObstacleAction.ts";
import { treeResource } from "../../../../src/data/inventory/items/naturalResource.ts";

function createScene(): { root: Entity; worker: Entity; resource: Entity } {
    const { root } = createMinimalWorld();

    const worker = new Entity("worker");
    worker.setEcsComponent(createHeldItemComponent());
    root.addChild(worker);
    worker.worldPosition = { x: 10, y: 8 };

    const resource = new Entity("resource");
    resource.setEcsComponent(createResourceComponent("tree1"));
    resource.setEcsComponent(createHealthComponent(30, 30));
    root.addChild(resource);
    resource.worldPosition = { x: 11, y: 8 }; // adjacent to worker

    return { root, worker, resource };
}

describe("clearObstacleAction", () => {
    it("damages the obstacle each tick until it dies", () => {
        const { worker, resource } = createScene();

        const result = executeClearObstacleAction(
            { type: "clearObstacle", entityId: "resource" },
            worker,
        );

        assert.strictEqual(result.kind, "running");
        const health = resource.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(health.currentHp, 20);
    });

    it("removes the obstacle and scatters its yields on death", () => {
        const { root, worker, resource } = createScene();
        resource.getEcsComponent(HealthComponentId)!.currentHp = 5;

        const result = executeClearObstacleAction(
            { type: "clearObstacle", entityId: "resource" },
            worker,
        );

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(root.findEntity("resource"), null);

        const collectables = root.queryComponents(CollectableComponentId);
        assert.ok(
            collectables.size > 0,
            "felling the obstacle should scatter a ground pile",
        );
        const [[, collectable]] = collectables;
        assert.ok(hasCollectableItems(collectable));
        assert.strictEqual(
            collectable.items[0].item.id,
            treeResource.yields[0].item.id,
        );
    });

    it("never collects yields into the worker's held slot", () => {
        const { worker, resource } = createScene();
        resource.getEcsComponent(HealthComponentId)!.currentHp = 5;

        executeClearObstacleAction(
            { type: "clearObstacle", entityId: "resource" },
            worker,
        );

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.ok(isHeldEmpty(held), "held slot must stay empty after a clear");
    });

    it("completes immediately when the obstacle is already gone", () => {
        const { worker } = createScene();

        const result = executeClearObstacleAction(
            { type: "clearObstacle", entityId: "missing" },
            worker,
        );

        assert.strictEqual(result.kind, "complete");
    });

    it("fails when the worker is not adjacent to the obstacle", () => {
        const { worker, resource } = createScene();
        resource.worldPosition = { x: 25, y: 25 };

        const result = executeClearObstacleAction(
            { type: "clearObstacle", entityId: "resource" },
            worker,
        );

        assert.strictEqual(result.kind, "failed");
    });

    it("refuses to clear a permanent obstacle (infinite node)", () => {
        const { root, worker, resource } = createScene();
        // Replace the tree with stone — an infinite node that must never be
        // destroyed to clear a path.
        resource.setEcsComponent(createResourceComponent("stone1"));
        resource.getEcsComponent(HealthComponentId)!.currentHp = 5;

        const result = executeClearObstacleAction(
            { type: "clearObstacle", entityId: "resource" },
            worker,
        );

        assert.strictEqual(result.kind, "failed");
        assert.ok(
            root.findEntity("resource"),
            "the permanent obstacle must not be removed",
        );
    });
});
