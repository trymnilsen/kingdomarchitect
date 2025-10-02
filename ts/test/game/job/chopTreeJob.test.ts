import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.js";
import {
    ChopTreeJob,
    chopTreeHandler,
} from "../../../src/game/job/chopTreeJob.js";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.js";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.js";
import {
    createJobRunnerComponent,
    JobRunnerComponentId,
} from "../../../src/game/component/jobRunnerComponent.js";
import { treeResource } from "../../../src/data/inventory/items/naturalResource.js";
import type { Point } from "../../../src/common/point.js";

/**
 * Test harness for job testing. Sets up a minimal world with a root entity,
 * a runner (worker), and a target entity.
 */
class JobTestHarness {
    root: Entity;
    runner: Entity;
    target: Entity;

    constructor(
        runnerPosition: Point = { x: 0, y: 0 },
        targetPosition: Point = { x: 1, y: 0 },
    ) {
        // Create root entity
        this.root = new Entity("root");

        // Create runner entity (worker)
        this.runner = new Entity("runner");
        this.runner.worldPosition = runnerPosition;
        this.runner.setEcsComponent(createJobRunnerComponent());
        this.root.addChild(this.runner);

        // Create target entity (tree)
        this.target = new Entity("target");
        this.target.worldPosition = targetPosition;
        this.root.addChild(this.target);
    }

    /**
     * Execute the job handler once
     */
    executeJob(job: ChopTreeJob) {
        chopTreeHandler(this.root, this.runner, job);
    }

    /**
     * Get the current job assigned to the runner
     */
    getCurrentJob(): ChopTreeJob | null {
        const jobRunner = this.runner.getEcsComponent(JobRunnerComponentId);
        return jobRunner?.currentJob as ChopTreeJob | null;
    }

    /**
     * Check if the runner has completed the job
     */
    isJobCompleted(): boolean {
        return this.getCurrentJob() === null;
    }
}

describe("ChopTreeJob", () => {
    describe("Job Creation", () => {
        it("creates a job with correct entity id", () => {
            const entity = new Entity("tree-1");
            const job = ChopTreeJob(entity);

            assert.strictEqual(job.id, "chopTreeJob");
            assert.strictEqual(job.entityId, "tree-1");
        });
    });

    describe("Job Execution", () => {
        it("completes job when tree entity not found", () => {
            const harness = new JobTestHarness();
            const job = ChopTreeJob(new Entity("nonexistent"));

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree has no resource component", () => {
            const harness = new JobTestHarness();
            // Target has no resource component
            harness.target.setEcsComponent(createHealthComponent(100, 100));

            const job = ChopTreeJob(harness.target);
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree has no health component", () => {
            const harness = new JobTestHarness();
            // Target has resource but no health
            harness.target.setEcsComponent(
                createResourceComponent(treeResource),
            );

            const job = ChopTreeJob(harness.target);
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree health reaches zero", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource),
            );
            harness.target.setEcsComponent(createHealthComponent(10, 100)); // Low health

            const job = ChopTreeJob(harness.target);
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            const health = harness.target.getEcsComponent(HealthComponentId);
            assert.strictEqual(health?.currentHp, 0, "Tree should have 0 HP");
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );
        });
    });

    describe("Adjacency Requirements", () => {
        /**
         * Helper function to test adjacency damage in different directions
         */
        function testAdjacentDamage(
            description: string,
            runnerPos: Point,
            treePos: Point,
        ) {
            it(description, () => {
                const harness = new JobTestHarness(runnerPos, treePos);

                harness.target.setEcsComponent(
                    createResourceComponent(treeResource),
                );
                harness.target.setEcsComponent(createHealthComponent(100, 100));

                const job = ChopTreeJob(harness.target);
                harness.runner.setEcsComponent({
                    id: JobRunnerComponentId,
                    currentJob: job,
                });

                harness.executeJob(job);

                const health =
                    harness.target.getEcsComponent(HealthComponentId);
                assert.strictEqual(
                    health?.currentHp,
                    90,
                    `Tree should take damage when ${description}`,
                );
            });
        }

        // Test all four cardinal directions
        testAdjacentDamage(
            "damages tree when adjacent to the right",
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent to the left",
            { x: 1, y: 0 },
            { x: 0, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent above",
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent below",
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        );

        // Note: When runner and tree are at the exact same position,
        // checkAdjacency returns null (not adjacent), so the job will
        // attempt to move, which requires pathfinding setup not in these tests.
    });
});
