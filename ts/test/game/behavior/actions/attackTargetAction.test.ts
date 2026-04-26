import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    addThreat,
    createThreatMapComponent,
    ThreatMapComponentId,
} from "../../../../src/game/component/threatMapComponent.ts";
import {
    BehaviorAgentComponentId,
    createBehaviorAgentComponent,
} from "../../../../src/game/component/BehaviorAgentComponent.ts";
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

function createCombatScene(): {
    root: Entity;
    worker: Entity;
    target: Entity;
} {
    const scene = createTestScene();
    scene.target.setEcsComponent(createThreatMapComponent());
    scene.target.setEcsComponent(createBehaviorAgentComponent());
    const agent = scene.target.getEcsComponent(BehaviorAgentComponentId)!;
    // The default factory seeds pendingReplan; clear it so we can observe
    // whether the action under test sets it.
    agent.pendingReplan = undefined;
    return scene;
}

describe("attackTargetAction", () => {
    it("deals damage to target each tick", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        const result = executeAttackTargetAction(action, worker, 1);

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

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(healthComponent.currentHp, 0);
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "nonexistent",
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, target } = createTestScene();
        target.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        const result = executeAttackTargetAction(action, worker, 1);

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

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "failed");
    });

    it("continues running while target has hp remaining", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            targetId: "target",
        };

        // Execute multiple times
        let result = executeAttackTargetAction(action, worker, 1);
        assert.strictEqual(result.kind, "running");

        result = executeAttackTargetAction(action, worker, 2);
        assert.strictEqual(result.kind, "running");

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 8);
    });

    describe("replan trigger from threat", () => {
        it("triggers replan on the victim when a new attacker becomes top threat", () => {
            const { worker, target } = createCombatScene();
            const action = {
                type: "attackTarget" as const,
                targetId: "target",
            };

            executeAttackTargetAction(action, worker, 1);

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            assert.ok(
                agent.pendingReplan,
                "victim should replan when first attacker becomes top threat",
            );
        });

        it("does not re-trigger replan when the same attacker stays top threat", () => {
            const { worker, target } = createCombatScene();
            const threat = target.getEcsComponent(ThreatMapComponentId)!;
            // Worker is the established top threat from a prior fight tick.
            addThreat(threat, "worker", 5, 0);

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            agent.pendingReplan = undefined;

            const action = {
                type: "attackTarget" as const,
                targetId: "target",
            };
            executeAttackTargetAction(action, worker, 1);

            assert.strictEqual(
                agent.pendingReplan,
                undefined,
                "victim should not replan when the top threat is unchanged",
            );
        });

        it("triggers replan when a second attacker overtakes the previous top", () => {
            const { worker, target } = createCombatScene();
            const threat = target.getEcsComponent(ThreatMapComponentId)!;
            // Pre-seed: G2 is the established top with amount 2; worker is
            // also at 2 but loses ties (insertion order + strict `>`).
            // After one attack from worker, worker accumulates more and
            // overtakes G2. This couples to attackTargetAction's damage > 0,
            // which is a fair invariant — a no-op attack would be a bug.
            addThreat(threat, "G2", 2, 0);
            addThreat(threat, "worker", 2, 0);

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            agent.pendingReplan = undefined;

            const action = {
                type: "attackTarget" as const,
                targetId: "target",
            };
            executeAttackTargetAction(action, worker, 1);

            assert.ok(
                agent.pendingReplan,
                "victim should replan when a new attacker overtakes the top",
            );
        });
    });
});
