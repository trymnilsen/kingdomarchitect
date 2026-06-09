import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createBehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../../../src/game/component/BehaviorAgentComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { createBehaviorSystem } from "../../../../src/game/behavior/systems/BehaviorSystem.ts";
import type { Behavior } from "../../../../src/game/behavior/behaviors/Behavior.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";

/**
 * Create a mock behavior for testing
 */
function createMockBehavior(
    name: string,
    options: {
        isValid?: boolean;
        utility?: number;
        actions?: BehaviorActionData[];
    } = {},
): Behavior {
    return {
        name,
        isValid: () => options.isValid ?? true,
        utility: () => options.utility ?? 50,
        expand: () => options.actions ?? [],
    };
}

function createTestScene(): { root: Entity; worker: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");

    worker.worldPosition = { x: 10, y: 8 };
    worker.setEcsComponent(createBehaviorAgentComponent());

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);

    return { root, worker };
}

describe("BehaviorSystem", () => {
    describe("action queue progression", () => {
        it("removes completed action from queue", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // Queue a wait action that completes immediately (until tick 0)
            agent.actionQueue = [
                { type: "wait", until: 0 },
                { type: "wait", until: 100 },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // First wait action should complete and be removed
            assert.strictEqual(agent.actionQueue.length, 1);
            assert.strictEqual(agent.actionQueue[0].type, "wait");
            assert.strictEqual((agent.actionQueue[0] as any).until, 100);
        });

        it("executes next action after previous completes", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // Queue two wait actions, both complete immediately
            agent.actionQueue = [
                { type: "wait", until: 0 },
                { type: "wait", until: 0 },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);

            // First tick: first action completes
            system.onUpdate!(root, 1);
            assert.strictEqual(agent.actionQueue.length, 1);

            // Second tick: second action completes
            system.onUpdate!(root, 2);
            assert.strictEqual(agent.actionQueue.length, 0);
        });

        it("keeps running action in queue", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // Queue a wait action that hasn't completed yet
            agent.actionQueue = [{ type: "wait", until: 100 }];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // Action should still be in queue (running)
            assert.strictEqual(agent.actionQueue.length, 1);
        });
    });

    describe("action failure handling", () => {
        it("clears action queue on failure", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // Queue an action that will fail (collectItems on nonexistent entity)
            agent.actionQueue = [
                { type: "collectItems", entityId: "nonexistent" },
                { type: "wait", until: 100 },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // Queue should be cleared
            assert.strictEqual(agent.actionQueue.length, 0);
        });

        it("clears currentBehaviorName on failure", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            agent.actionQueue = [
                { type: "collectItems", entityId: "nonexistent" },
            ];
            agent.currentBehaviorName = "testBehavior";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, null);
        });

        it("triggers replan on failure", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            agent.actionQueue = [
                { type: "collectItems", entityId: "nonexistent" },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // Failure causes immediate replan same-tick; with no behaviors, currentBehaviorName is cleared
            assert.strictEqual(agent.currentBehaviorName, null);
        });

        it("unclaims job on action failure", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;
            const jobQueue = root.getEcsComponent(JobQueueComponentId)!;

            // Add a job claimed by the worker
            jobQueue.jobs = [
                { id: "collectItem", entityId: "chest", claimedBy: "worker" },
            ];

            agent.actionQueue = [
                { type: "collectItems", entityId: "nonexistent" },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // Job should be unclaimed
            assert.strictEqual(jobQueue.jobs[0].claimedBy, undefined);
        });
    });

    describe("replanning triggers", () => {
        it("replans when shouldReplan is true", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const behavior = createMockBehavior("newBehavior", {
                utility: 60,
                actions: [{ type: "wait", until: 100 }],
            });

            agent.pendingReplan = { kind: "replan" };
            agent.currentBehaviorName = null;

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "newBehavior");
            assert.strictEqual(agent.pendingReplan, undefined);
        });

        it("replans when action queue is empty", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const behavior = createMockBehavior("testBehavior", {
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });

            agent.actionQueue = [];
            agent.currentBehaviorName = null;

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "testBehavior");
            assert.strictEqual(agent.actionQueue.length, 1);
        });

        it("replans after queue empties from completed actions", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const behavior = createMockBehavior("continueBehavior", {
                actions: [{ type: "wait", until: 200 }],
            });

            // Start with one action that completes
            agent.actionQueue = [{ type: "wait", until: 0 }];
            agent.currentBehaviorName = "continueBehavior";

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            // After action completes, queue empties, should re-expand behavior
            assert.strictEqual(agent.actionQueue.length, 1);
            assert.strictEqual((agent.actionQueue[0] as any).until, 200);
        });
    });

    describe("behavior selection", () => {
        it("selects highest utility behavior", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const lowBehavior = createMockBehavior("low", {
                utility: 30,
                actions: [{ type: "wait", until: 100 }],
            });
            const highBehavior = createMockBehavior("high", {
                utility: 80,
                actions: [{ type: "wait", until: 100 }],
            });
            const medBehavior = createMockBehavior("medium", {
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });

            const system = createBehaviorSystem(() => [
                lowBehavior,
                highBehavior,
                medBehavior,
            ]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "high");
        });

        it("filters out invalid behaviors", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const invalidBehavior = createMockBehavior("invalid", {
                isValid: false,
                utility: 100,
                actions: [{ type: "wait", until: 100 }],
            });
            const validBehavior = createMockBehavior("valid", {
                isValid: true,
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });

            const system = createBehaviorSystem(() => [
                invalidBehavior,
                validBehavior,
            ]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "valid");
        });

        it("enters idle state when no valid behaviors", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const invalidBehavior = createMockBehavior("invalid", {
                isValid: false,
            });

            const system = createBehaviorSystem(() => [invalidBehavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, null);
            assert.strictEqual(agent.actionQueue.length, 0);
            // Invariant relied on by displacement: a settled (idle) worker has
            // pendingReplan cleared, so it classifies as displaceable rather than
            // transient. If this ever regresses, settled workers would silently become
            // un-shoveable (everyone would wait for them forever).
            assert.strictEqual(agent.pendingReplan, undefined);
        });

        it("populates action queue from selected behavior", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const behavior = createMockBehavior("test", {
                actions: [
                    { type: "wait", until: 50 },
                    { type: "wait", until: 100 },
                ],
            });

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.actionQueue.length, 2);
        });
    });

    describe("replan threshold (hysteresis)", () => {
        it("does not switch to slightly higher utility behavior", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const currentBehavior = createMockBehavior("current", {
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });
            const slightlyBetter = createMockBehavior("slightlyBetter", {
                utility: 52, // Only 2 higher, below threshold of 5
                actions: [{ type: "wait", until: 200 }],
            });

            // Force a replan and mark "current" as the behavior to favor. With the
            // +5 hysteresis bonus it scores 55 vs slightlyBetter's 52, so it holds.
            agent.hysteresis = { behaviorName: "current" };
            agent.actionQueue = [];
            agent.pendingReplan = { kind: "replan" };

            const system = createBehaviorSystem(() => [
                currentBehavior,
                slightlyBetter,
            ]);
            system.onUpdate!(root, 1);

            // Should stay with current behavior
            assert.strictEqual(agent.currentBehaviorName, "current");
        });

        it("switches to significantly higher utility behavior", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const currentBehavior = createMockBehavior("current", {
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });
            const muchBetter = createMockBehavior("muchBetter", {
                utility: 60, // 10 higher, above threshold of 5
                actions: [{ type: "wait", until: 200 }],
            });

            // Favor "current" via hysteresis. Even with the +5 bonus it scores 55,
            // below muchBetter's 60, so the planner should switch.
            agent.hysteresis = { behaviorName: "current" };
            agent.actionQueue = [];
            agent.pendingReplan = { kind: "replan" };

            const system = createBehaviorSystem(() => [
                currentBehavior,
                muchBetter,
            ]);
            system.onUpdate!(root, 1);

            // Should switch to better behavior
            assert.strictEqual(agent.currentBehaviorName, "muchBetter");
        });

        it("retains hysteresis when a plan completes, so the finished behavior is still favored", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // "haul" is the running behavior; a slightly stronger "other" exists.
            const haul = createMockBehavior("haul", {
                utility: 50,
                actions: [{ type: "wait", until: 200 }],
            });
            const other = createMockBehavior("other", {
                utility: 53, // higher raw utility, but below haul's +5 bonus
                actions: [{ type: "wait", until: 200 }],
            });

            // Running haul with a single action that completes immediately. No
            // pending replan, so this tick just executes-and-completes the action.
            agent.currentBehaviorName = "haul";
            agent.hysteresis = { behaviorName: "haul" };
            agent.actionQueue = [{ type: "wait", until: 0 }];
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => [haul, other]);

            // Tick 1: action completes, queue empties. Display state is cleared
            // (no stale behavior name), but the hysteresis memory survives.
            system.onUpdate!(root, 1);
            assert.strictEqual(agent.currentBehaviorName, null);
            assert.strictEqual(agent.actionQueue.length, 0);
            assert.deepStrictEqual(agent.hysteresis, { behaviorName: "haul" });

            // Tick 2: replan runs. haul (50 + 5 bonus = 55) beats other (53),
            // proving the bonus survived completion.
            system.onUpdate!(root, 2);
            assert.strictEqual(agent.currentBehaviorName, "haul");
        });

        it("clears hysteresis on failure, dropping the bonus", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // An action that fails (collectItems on a nonexistent entity).
            agent.actionQueue = [
                { type: "collectItems", entityId: "nonexistent" },
            ];
            agent.currentBehaviorName = "test";
            agent.hysteresis = { behaviorName: "test" };
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            // Abnormal termination forgets the favored behavior entirely.
            assert.strictEqual(agent.hysteresis, null);
            assert.strictEqual(agent.currentBehaviorName, null);
        });
    });

    describe("queue replacement on selection", () => {
        it("rebuilds the queue fresh when the same behavior is re-selected", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const headAction: BehaviorActionData = { type: "wait", until: 100 };
            agent.actionQueue = [headAction, { type: "wait", until: 200 }];
            agent.currentBehaviorName = "myBehavior";
            agent.hysteresis = { behaviorName: "myBehavior" };
            // Forced replan (e.g. the worker was displaced) while myBehavior is
            // still the best choice. The queue is rebuilt from scratch — there
            // is no head reuse; a forced replan wants a fresh plan/path.
            agent.pendingReplan = { kind: "replan" };

            const behavior = createMockBehavior("myBehavior", {
                utility: 50,
                actions: [
                    { type: "wait", until: 100 },
                    { type: "wait", until: 999 },
                ],
            });

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "myBehavior");
            assert.notStrictEqual(
                agent.actionQueue[0],
                headAction,
                "queue is rebuilt fresh on replan, not reconciled from the head",
            );
            assert.strictEqual((agent.actionQueue[0] as any).until, 100);
            assert.strictEqual((agent.actionQueue[1] as any).until, 999);
        });

        it("fully replaces the queue when a different behavior is selected", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const headAction: BehaviorActionData = { type: "wait", until: 100 };
            agent.actionQueue = [headAction];
            agent.currentBehaviorName = "behaviorA";
            // behaviorA was the last selection; switching to behaviorB must replace.
            agent.hysteresis = { behaviorName: "behaviorA" };
            agent.pendingReplan = { kind: "replan" };

            const behaviorA = createMockBehavior("behaviorA", {
                utility: 40,
                actions: [{ type: "wait", until: 100 }],
            });
            const behaviorB = createMockBehavior("behaviorB", {
                utility: 60,
                actions: [{ type: "wait", until: 999 }],
            });

            const system = createBehaviorSystem(() => [behaviorA, behaviorB]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "behaviorB");
            assert.notStrictEqual(
                agent.actionQueue[0],
                headAction,
                "queue should be replaced, not reconciled",
            );
            assert.strictEqual((agent.actionQueue[0] as any).until, 999);
        });
    });

    describe("idle re-selection and busy commitment", () => {
        it("re-selects an idle worker with an empty queue and no pending replan", () => {
            // The core bug fix: an idle worker (no plan, pendingReplan cleared)
            // re-selects on its own instead of freezing until an external poke.
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            agent.actionQueue = [];
            agent.currentBehaviorName = null;
            agent.pendingReplan = undefined;

            const behavior = createMockBehavior("work", {
                utility: 50,
                actions: [{ type: "wait", until: 100 }],
            });

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "work");
            assert.strictEqual(agent.actionQueue.length, 1);
        });

        it("does not re-select a busy worker mid-plan even when a better behavior exists", () => {
            // A running plan is committed: a higher-utility behavior does not
            // preempt it. Only an empty queue or a forced replan re-selects.
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            const running = createMockBehavior("running", {
                utility: 50,
                actions: [{ type: "wait", until: 999 }],
            });
            const better = createMockBehavior("better", {
                utility: 90,
                actions: [{ type: "wait", until: 1 }],
            });

            agent.actionQueue = [{ type: "wait", until: 999 }];
            agent.currentBehaviorName = "running";
            agent.hysteresis = { behaviorName: "running" };
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => [running, better]);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.currentBehaviorName, "running");
            assert.strictEqual(agent.actionQueue.length, 1);
            assert.strictEqual((agent.actionQueue[0] as any).until, 999);
        });

        it("does not set pendingReplan when a plan completes, keeping the worker displaceable", () => {
            // Displacement invariant: a just-finished worker must classify as
            // displaceable (pendingReplan undefined), not transient. Re-selection
            // is driven by the now-empty queue, not by a pending replan.
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            agent.actionQueue = [{ type: "wait", until: 0 }];
            agent.currentBehaviorName = "done";
            agent.hysteresis = { behaviorName: "done" };
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);
            system.onUpdate!(root, 1);

            assert.strictEqual(agent.actionQueue.length, 0);
            assert.strictEqual(agent.pendingReplan, undefined);
            assert.strictEqual(agent.currentBehaviorName, null);
        });
    });

    describe("multiple agents", () => {
        it("updates all agents with behavior components", () => {
            const { root } = createTestScene();

            // Add a second worker
            const worker2 = new Entity("worker2");
            worker2.worldPosition = { x: 5, y: 5 };
            worker2.setEcsComponent(createBehaviorAgentComponent());
            root.addChild(worker2);

            const behavior = createMockBehavior("shared", {
                actions: [{ type: "wait", until: 100 }],
            });

            const system = createBehaviorSystem(() => [behavior]);
            system.onUpdate!(root, 1);

            const agent1 = root
                .findEntity("worker")!
                .getEcsComponent(BehaviorAgentComponentId)!;
            const agent2 = worker2.getEcsComponent(BehaviorAgentComponentId)!;

            assert.strictEqual(agent1.currentBehaviorName, "shared");
            assert.strictEqual(agent2.currentBehaviorName, "shared");
        });
    });

    describe("exception handling", () => {
        it("treats action exception as failure", () => {
            const { root, worker } = createTestScene();
            const agent = worker.getEcsComponent(BehaviorAgentComponentId)!;

            // The attackTarget action will throw because target entity doesn't exist
            // and the action executor may throw in some error conditions
            // Using a more predictable failure case: harvestResource with no worker inventory
            agent.actionQueue = [
                {
                    type: "harvestResource",
                    entityId: "nonexistent",
                    harvestAction: 0,
                },
            ];
            agent.currentBehaviorName = "test";
            agent.pendingReplan = undefined;

            const system = createBehaviorSystem(() => []);

            // Should not throw, should handle gracefully
            assert.doesNotThrow(() => {
                system.onUpdate!(root, 1);
            });

            // Should have cleaned up after failure
            assert.strictEqual(agent.actionQueue.length, 0);
            assert.strictEqual(agent.currentBehaviorName, null);
        });
    });
});
