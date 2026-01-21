import { describe, it } from "node:test";
import assert from "node:assert";
import { createPerformJobBehavior } from "../../../src/game/behavior/behaviors/PerformJobBehavior.ts";
import {
    createEntityWithJobRunner,
    createRootWithJobQueue,
    createTestJob,
    createBehaviorTestEntity,
} from "./behaviorTestHelpers.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";

describe("PerformJobBehavior", () => {
    describe("isValid", () => {
        it("returns true when entity has current job", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue();
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const runner = entity.getEcsComponent(JobRunnerComponentId);
            runner!.currentJob = createTestJob();

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns true when unclaimed jobs exist in queue", () => {
            const behavior = createPerformJobBehavior();
            const job = createTestJob();
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns false when entity has no job runner", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns false when no jobs in queue", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue([]);
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns false when all jobs are claimed", () => {
            const behavior = createPerformJobBehavior();
            const job = createTestJob();
            job.state = "claimed";
            job.claimedBy = "other-worker";
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns false when job has entity constraint for different entity", () => {
            const behavior = createPerformJobBehavior();
            const job = createTestJob();
            job.constraint = { type: "entity", id: "other-worker" };
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns true when job has entity constraint matching this entity", () => {
            const behavior = createPerformJobBehavior();
            const job = createTestJob();
            job.constraint = { type: "entity", id: "worker" };
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner("worker");
            root.addChild(entity);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });
    });

    describe("utility", () => {
        it("returns 50 for job work", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue();
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 50);
        });
    });

    describe("expand", () => {
        it("returns executeJob action when entity has current job", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue();
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const runner = entity.getEcsComponent(JobRunnerComponentId);
            runner!.currentJob = createTestJob();

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "executeJob");
        });

        it("returns claimJob and executeJob actions when job available", () => {
            const behavior = createPerformJobBehavior();
            const job = createTestJob("collectResource", "resource-1");
            const root = createRootWithJobQueue([job]);
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            // Create the resource entity that the job references
            const resourceEntity = new Entity("resource-1");
            resourceEntity.worldPosition = { x: 5, y: 5 };
            root.addChild(resourceEntity);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "claimJob");
            assert.strictEqual(actions[1].type, "executeJob");
            if (actions[0].type === "claimJob") {
                assert.strictEqual(actions[0].jobIndex, 0);
            }
        });

        it("returns empty array when no job runner", () => {
            const behavior = createPerformJobBehavior();
            const root = createRootWithJobQueue();
            const entity = createBehaviorTestEntity();
            root.addChild(entity);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array when no job queue", () => {
            const behavior = createPerformJobBehavior();
            const root = new Entity("root");
            const entity = createEntityWithJobRunner();
            root.addChild(entity);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 0);
        });

        it("selects closest job when multiple jobs available", () => {
            const behavior = createPerformJobBehavior();
            const farResource = createTestJob("collectResource", "far-resource");
            const nearResource = createTestJob(
                "collectResource",
                "near-resource",
            );

            const root = createRootWithJobQueue([farResource, nearResource]);
            const entity = createEntityWithJobRunner();
            entity.worldPosition = { x: 0, y: 0 };

            const farEntity = new Entity("far-resource");
            farEntity.worldPosition = { x: 100, y: 100 };
            root.addChild(farEntity);

            const nearEntity = new Entity("near-resource");
            nearEntity.worldPosition = { x: 5, y: 5 };
            root.addChild(nearEntity);

            root.addChild(entity);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 2);
            if (actions[0].type === "claimJob") {
                assert.strictEqual(actions[0].jobIndex, 1);
            }
        });
    });

    describe("name", () => {
        it("has name 'performJob'", () => {
            const behavior = createPerformJobBehavior();

            assert.strictEqual(behavior.name, "performJob");
        });
    });
});
