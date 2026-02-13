import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planAttack } from "../../../../src/game/job/planner/attackPlanner.ts";
import { AttackJob } from "../../../../src/game/job/attackJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; target: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const target = new Entity("target");

    worker.worldPosition = { x: 0, y: 0 };
    target.worldPosition = { x: 5, y: 5 };

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(target);

    return { root, worker, target };
}

describe("attackPlanner", () => {
    it("returns moveTo and attackTarget actions", () => {
        const { root, worker } = createTestScene();

        const job = AttackJob("worker", "target");
        const actions = planAttack(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "attackTarget");
    });

    it("sets correct target position for moveTo action", () => {
        const { root, worker, target } = createTestScene();
        target.worldPosition = { x: 10, y: 15 };

        const job = AttackJob("worker", "target");
        const actions = planAttack(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number } };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("sets correct targetId for attackTarget action", () => {
        const { root, worker } = createTestScene();

        const job = AttackJob("worker", "target");
        const actions = planAttack(root, worker, job);

        const attackAction = actions[1] as { type: "attackTarget"; targetId: string };
        assert.strictEqual(attackAction.targetId, "target");
    });

    it("returns empty array and fails job if target not found", () => {
        const { root, worker } = createTestScene();

        const job = AttackJob("worker", "nonexistent");
        const actions = planAttack(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});
