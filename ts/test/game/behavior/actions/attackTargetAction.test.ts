import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import { executeAttackTargetAction } from "../../../../src/game/behavior/actions/attackTargetAction.ts";

function createTestScene(): { root: Entity; worker: Entity; target: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const target = new Entity("target");

    worker.worldPosition = { x: 10, y: 8 };
    target.worldPosition = { x: 11, y: 8 }; // Adjacent

    target.setEcsComponent(createHealthComponent(10, 10));

    root.addChild(worker);
    root.addChild(target);

    return { root, worker, target };
}

describe("attackTargetAction", () => {
    it("deals damage to target each tick", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        const result = executeAttackTargetAction(action, worker);

        assert.strictEqual(result.kind, "running");

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 9);
    });

    it("completes when target hp reaches 0", () => {
        const { worker, target } = createTestScene();

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        healthComponent.currentHp = 1;

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        const result = executeAttackTargetAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(healthComponent.currentHp, 0);
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "nonexistent",
        };

        const result = executeAttackTargetAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, target } = createTestScene();
        target.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        const result = executeAttackTargetAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if target has no HealthComponent", () => {
        const { root, worker } = createTestScene();
        const noHealthTarget = new Entity("noHealthTarget");
        noHealthTarget.worldPosition = { x: 11, y: 8 };
        root.addChild(noHealthTarget);

        const action = {
            type: "attackTarget" as const,
            targetId: "noHealthTarget",
        };

        const result = executeAttackTargetAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("continues running while target has hp remaining", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        // Execute multiple times
        let result = executeAttackTargetAction(action, worker);
        assert.strictEqual(result.kind, "running");

        result = executeAttackTargetAction(action, worker);
        assert.strictEqual(result.kind, "running");

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 8);
    });
});
