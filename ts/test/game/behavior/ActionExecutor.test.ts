import { describe, it } from "node:test";
import assert from "node:assert";
import { executeAction } from "../../../src/game/behavior/actions/ActionExecutor.ts";
import {
    createBehaviorTestEntity,
    createEntityWithEnergy,
    createEntityWithJobRunner,
    createRootWithJobQueue,
    createTestJob,
} from "./behaviorTestHelpers.ts";
import { getBehaviorAgent } from "../../../src/game/behavior/components/BehaviorAgentComponent.ts";
import { EnergyComponentId } from "../../../src/game/component/energyComponent.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";

describe("ActionExecutor", () => {
    describe("wait action", () => {
        it("returns running when current tick is before target", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "wait" as const, until: 100 };

            const status = executeAction(action, entity, 50);

            assert.strictEqual(status, "running");
        });

        it("returns complete when current tick reaches target", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "wait" as const, until: 100 };

            const status = executeAction(action, entity, 100);

            assert.strictEqual(status, "complete");
        });

        it("returns complete when current tick exceeds target", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "wait" as const, until: 100 };

            const status = executeAction(action, entity, 150);

            assert.strictEqual(status, "complete");
        });
    });

    describe("moveTo action", () => {
        it("returns complete when already at target position", () => {
            const entity = createBehaviorTestEntity("test", 10, 10);
            const action = { type: "moveTo" as const, target: { x: 10, y: 10 } };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "complete");
        });
    });

    describe("playerMove action", () => {
        it("returns complete and clears command when already at target", () => {
            const entity = createBehaviorTestEntity("test", 10, 10);
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "move",
                targetPosition: { x: 10, y: 10 },
            };
            const action = {
                type: "playerMove" as const,
                target: { x: 10, y: 10 },
            };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "complete");
            assert.strictEqual(agent!.playerCommand, undefined);
        });
    });

    describe("claimJob action", () => {
        it("claims job and sets it as current job", () => {
            const job = createTestJob();
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 0 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "complete");

            const runner = entity.getEcsComponent(JobRunnerComponentId);
            assert.strictEqual(runner!.currentJob, job);
            assert.strictEqual(job.state, "claimed");
            assert.strictEqual(job.claimedBy, "worker");
        });

        it("fails when job runner component missing", () => {
            const job = createTestJob();
            const root = createRootWithJobQueue([job]);
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 0 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("fails when job queue missing", () => {
            const root = new Entity("root");
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 0 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("fails when job index out of bounds", () => {
            const root = createRootWithJobQueue([]);
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 5 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("fails when job already claimed by another worker", () => {
            const job = createTestJob();
            job.state = "claimed";
            job.claimedBy = "other-worker";
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 0 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("succeeds when job already claimed by this worker", () => {
            const job = createTestJob();
            job.state = "claimed";
            job.claimedBy = "worker";
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const action = { type: "claimJob" as const, jobIndex: 0 };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "complete");
        });
    });

    describe("executeJob action", () => {
        it("fails when entity has no job runner", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "executeJob" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("fails when entity has no current job", () => {
            const root = createRootWithJobQueue();
            const entity = createEntityWithJobRunner();
            root.addChild(entity);
            const action = { type: "executeJob" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });

        it("fails when no handler found for job type", () => {
            const root = createRootWithJobQueue();
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const runner = entity.getEcsComponent(JobRunnerComponentId);
            runner!.currentJob = {
                id: "nonExistentJob" as any,
                state: "claimed",
                claimedBy: "worker",
            } as any;

            const action = { type: "executeJob" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });
    });

    describe("sleep action", () => {
        it("recovers energy and returns running when not fully rested", () => {
            const entity = createEntityWithEnergy("test", 50);
            const energyComponent = entity.getEcsComponent(EnergyComponentId);
            energyComponent!.restoreRate = 5;

            const action = { type: "sleep" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "running");
            assert.strictEqual(energyComponent!.energy, 55);
        });

        it("recovers energy and returns complete when fully rested", () => {
            const entity = createEntityWithEnergy("test", 98);
            const energyComponent = entity.getEcsComponent(EnergyComponentId);
            energyComponent!.restoreRate = 5;

            const action = { type: "sleep" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "complete");
            assert.strictEqual(energyComponent!.energy, 100);
        });

        it("caps energy at 100", () => {
            const entity = createEntityWithEnergy("test", 99);
            const energyComponent = entity.getEcsComponent(EnergyComponentId);
            energyComponent!.restoreRate = 10;

            const action = { type: "sleep" as const };

            executeAction(action, entity, 0);

            assert.strictEqual(energyComponent!.energy, 100);
        });

        it("fails when entity has no energy component", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "sleep" as const };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });
    });

    describe("unknown action type", () => {
        it("returns failed for unknown action type", () => {
            const entity = createBehaviorTestEntity();
            const action = { type: "unknownAction" as any };

            const status = executeAction(action, entity, 0);

            assert.strictEqual(status, "failed");
        });
    });
});
