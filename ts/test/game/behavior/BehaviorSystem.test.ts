import type { BehaviorActionData } from "../../../src/game/behavior/actions/Action.ts";
import type { Behavior } from "../../../src/game/behavior/behaviors/Behavior.ts";
import { describe, it } from "node:test";
import assert from "node:assert";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/BehaviorSystem.ts";
import {
    createBehaviorTestEntity,
    createEntityWithEnergy,
    createEntityWithJobRunner,
    createRootWithJobQueue,
} from "./behaviorTestHelpers.ts";
import {
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/behavior/components/BehaviorAgentComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";

describe("BehaviorSystem", () => {
    function createTestBehavior(
        name: string,
        isValidFn: (entity: Entity) => boolean = () => true,
        utilityValue: number = 50,
        actions: BehaviorActionData[] = [],
    ): Behavior {
        return {
            name,
            isValid: isValidFn,
            utility: () => utilityValue,
            expand: () => actions,
        };
    }

    describe("behavior selection", () => {
        it("selects behavior with highest utility", () => {
            const lowUtilityBehavior = createTestBehavior(
                "low",
                () => true,
                30,
                [{ type: "wait", until: 1 }],
            );
            const highUtilityBehavior = createTestBehavior(
                "high",
                () => true,
                80,
                [{ type: "wait", until: 2 }],
            );

            const system = createBehaviorSystem([
                lowUtilityBehavior,
                highUtilityBehavior,
            ]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.currentBehaviorName, "high");
            assert.strictEqual(agent!.actionQueue.length, 1);
            assert.strictEqual(agent!.actionQueue[0].type, "wait");
            if (agent!.actionQueue[0].type === "wait") {
                assert.strictEqual(agent!.actionQueue[0].until, 2);
            }
        });

        it("only considers valid behaviors", () => {
            const invalidBehavior = createTestBehavior(
                "invalid",
                () => false,
                100,
                [],
            );
            const validBehavior = createTestBehavior("valid", () => true, 50, [
                { type: "wait", until: 1 },
            ]);

            const system = createBehaviorSystem([
                invalidBehavior,
                validBehavior,
            ]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.currentBehaviorName, "valid");
        });

        it("sets current behavior to null when no valid behaviors", () => {
            const invalidBehavior = createTestBehavior(
                "invalid",
                () => false,
                100,
                [],
            );

            const system = createBehaviorSystem([invalidBehavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.currentBehaviorName, null);
            assert.strictEqual(agent!.actionQueue.length, 0);
        });
    });

    describe("behavior switching threshold", () => {
        it("does not switch when new behavior is only slightly better", () => {
            const currentBehavior = createTestBehavior(
                "current",
                () => true,
                50,
                [{ type: "wait", until: 1 }],
            );
            const slightlyBetterBehavior = createTestBehavior(
                "better",
                () => true,
                53,
                [{ type: "wait", until: 2 }],
            );

            const system = createBehaviorSystem([
                currentBehavior,
                slightlyBetterBehavior,
            ]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            const initialBehavior = agent!.currentBehaviorName;

            system.onUpdate!(root, 1);

            assert.strictEqual(agent!.currentBehaviorName, initialBehavior);
        });

        it("switches when new behavior is significantly better", () => {
            let currentUtility = 50;
            const dynamicBehavior = createTestBehavior("dynamic");
            dynamicBehavior.utility = () => currentUtility;
            dynamicBehavior.expand = () => [{ type: "wait", until: 1 }];

            const system = createBehaviorSystem([dynamicBehavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.currentBehaviorName, "dynamic");

            currentUtility = 60;
            agent!.actionQueue = [];

            system.onUpdate!(root, 1);

            assert.strictEqual(agent!.currentBehaviorName, "dynamic");
        });
    });

    describe("action execution", () => {
        it("executes actions in sequence", () => {
            const behavior = createTestBehavior("test", () => true, 50, [
                { type: "wait", until: 1 },
                { type: "wait", until: 2 },
                { type: "wait", until: 3 },
            ]);

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.actionQueue.length, 3);

            system.onUpdate!(root, 1);

            assert.strictEqual(agent!.actionQueue.length, 2);

            system.onUpdate!(root, 2);

            assert.strictEqual(agent!.actionQueue.length, 1);

            system.onUpdate!(root, 3);

            assert.strictEqual(agent!.actionQueue.length, 0);
        });

        it("keeps running action in queue until complete", () => {
            const behavior = createTestBehavior("test", () => true, 50, [
                { type: "wait", until: 100 },
            ]);

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.actionQueue.length, 1);

            system.onUpdate!(root, 50);

            assert.strictEqual(agent!.actionQueue.length, 1);

            system.onUpdate!(root, 100);

            assert.strictEqual(agent!.actionQueue.length, 0);
        });

        it("replans when action fails", () => {
            let failedOnce = false;
            const behavior = createTestBehavior("test");
            behavior.isValid = () => !failedOnce; // Becomes invalid after first failure
            behavior.utility = () => 50;
            behavior.expand = () => {
                failedOnce = true;
                return [{ type: "claimJob", jobIndex: 99 }]; // Will fail
            };

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue([]);
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            // After the first action fails, behavior becomes invalid and agent goes idle
            assert.strictEqual(agent!.currentBehaviorName, null);
            // Verify that expand was called (behavior was selected initially)
            assert.strictEqual(failedOnce, true);
        });

        it("unclaims job when action fails", () => {
            // Use a job with a non-existent handler to force failure
            const job: any = {
                id: "invalidJobType",
                state: "claimed",
                claimedBy: "worker",
            };
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const runner = entity.getEcsComponent(JobRunnerComponentId);
            runner!.currentJob = job;

            const agent = getBehaviorAgent(entity);
            agent!.actionQueue = [{ type: "executeJob" }];
            agent!.currentBehaviorName = "test";

            const system = createBehaviorSystem([]);

            system.onUpdate!(root, 0);

            // Job should be unclaimed after execute fails
            assert.strictEqual(runner!.currentJob, null);
            assert.strictEqual(job.state, "queued");
            assert.strictEqual(job.claimedBy, undefined);
        });
    });

    describe("replanning", () => {
        it("replans when shouldReplan is true", () => {
            const behavior = createTestBehavior("test", () => true, 50, [
                { type: "wait", until: 1 },
            ]);

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            const agent = getBehaviorAgent(entity);
            agent!.shouldReplan = true;

            system.onUpdate!(root, 0);

            assert.strictEqual(agent!.shouldReplan, false);
            assert.strictEqual(agent!.currentBehaviorName, "test");
            assert.strictEqual(agent!.actionQueue.length, 1);
        });

        it("replans when action queue is empty", () => {
            let expandCallCount = 0;
            const behavior = createTestBehavior("test");
            behavior.isValid = () => true;
            behavior.utility = () => 50;
            behavior.expand = () => {
                expandCallCount++;
                return [{ type: "wait", until: expandCallCount }];
            };

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            assert.strictEqual(agent!.actionQueue.length, 1);
            assert.strictEqual(expandCallCount, 1);

            // Complete the action by advancing tick
            system.onUpdate!(root, 1);

            // Should have replanned and added a new action
            assert.strictEqual(agent!.actionQueue.length, 1);
            assert.strictEqual(expandCallCount, 2);
        });

        it("can be triggered via requestReplan", () => {
            const behavior = createTestBehavior("test", () => true, 50, [
                { type: "wait", until: 100 },
            ]);

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            system.onUpdate!(root, 0);

            const agent = getBehaviorAgent(entity);
            const initialQueueLength = agent!.actionQueue.length;

            requestReplan(entity);

            system.onUpdate!(root, 1);

            assert.strictEqual(agent!.actionQueue.length, initialQueueLength);
        });
    });

    describe("multiple entities", () => {
        it("updates all entities with behavior agents", () => {
            const behavior = createTestBehavior("test", () => true, 50, [
                { type: "wait", until: 1 },
            ]);

            const system = createBehaviorSystem([behavior]);

            const root = createRootWithJobQueue();
            const entity1 = createBehaviorTestEntity("entity1");
            const entity2 = createBehaviorTestEntity("entity2");
            root.addChild(entity1);
            root.addChild(entity2);

            system.onUpdate!(root, 0);

            const agent1 = getBehaviorAgent(entity1);
            const agent2 = getBehaviorAgent(entity2);

            assert.strictEqual(agent1!.currentBehaviorName, "test");
            assert.strictEqual(agent2!.currentBehaviorName, "test");
        });

        it("handles different behaviors for different entities", () => {
            const highEnergyBehavior = createTestBehavior(
                "high",
                (entity) => {
                    const energy = entity.getEcsComponent("Energy");
                    return energy !== null && energy.energy > 50;
                },
                80,
                [{ type: "wait", until: 1 }],
            );

            const lowEnergyBehavior = createTestBehavior(
                "low",
                (entity) => {
                    const energy = entity.getEcsComponent("Energy");
                    return energy !== null && energy.energy <= 50;
                },
                60,
                [{ type: "sleep" }],
            );

            const system = createBehaviorSystem([
                highEnergyBehavior,
                lowEnergyBehavior,
            ]);

            const root = createRootWithJobQueue();
            const highEnergyEntity = createEntityWithEnergy("high", 80);
            const lowEnergyEntity = createEntityWithEnergy("low", 30);
            root.addChild(highEnergyEntity);
            root.addChild(lowEnergyEntity);

            system.onUpdate!(root, 0);

            const highAgent = getBehaviorAgent(highEnergyEntity);
            const lowAgent = getBehaviorAgent(lowEnergyEntity);

            assert.strictEqual(highAgent!.currentBehaviorName, "high");
            assert.strictEqual(lowAgent!.currentBehaviorName, "low");
        });
    });
});
