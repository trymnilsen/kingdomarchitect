import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import {
    createRegrowComponent,
    RegrowComponentId,
} from "../../../src/game/component/regrowComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import {
    berryBushResource,
    flowerResource,
    ResourceHarvestMode,
} from "../../../src/data/inventory/items/naturalResource.ts";
import type { Point } from "../../../src/common/point.ts";
import { JobTestHarness } from "./jobTestHarness.ts";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.ts";
import { zeroPoint } from "../../../src/common/point.ts";

describe("PickHarvestJob", () => {
    describe("Job Creation", () => {
        it("creates a picking job with correct entity id", () => {
            const entity = new Entity("berry-1");
            const job = CollectResourceJob(entity, ResourceHarvestMode.Pick);

            assert.strictEqual(job.id, "collectResource");
            assert.strictEqual(job.entityId, "berry-1");
            assert.strictEqual(job.harvestAction, ResourceHarvestMode.Pick);
            assert.strictEqual(job.workProgress, 0);
        });
    });

    describe("Job Execution", () => {
        it("completes job when resource entity not found", () => {
            const harness = new JobTestHarness();
            const job = CollectResourceJob(
                new Entity("nonexistent"),
                ResourceHarvestMode.Pick,
            );

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when resource has no resource component", () => {
            const harness = new JobTestHarness();

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job and grants items after work duration", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(berryBushResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(berryBushResource.asset, zeroPoint()),
            );
            harness.target.setEcsComponent(
                createRegrowComponent(berryBushResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed after work duration",
            );
        });
    });

    describe("Remove Lifecycle", () => {
        it("removes flower entity permanently after picking", () => {
            const harness = new JobTestHarness({ x: 0, y: 0 }, { x: 1, y: 0 });

            harness.target.setEcsComponent(
                createResourceComponent(flowerResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(flowerResource.asset, zeroPoint()),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const targetId = harness.target.id;

            harness.executeJob(job);

            assert.strictEqual(
                harness.root.findEntity(targetId),
                null,
                "Flower entity should be removed from the world",
            );
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );
        });

        it("flower does not have regrow component", () => {
            const harness = new JobTestHarness({ x: 0, y: 0 }, { x: 1, y: 0 });

            harness.target.setEcsComponent(
                createResourceComponent(flowerResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(flowerResource.asset, zeroPoint()),
            );

            const regrowComponent =
                harness.target.getEcsComponent(RegrowComponentId);
            assert.ok(
                !regrowComponent,
                "Flower should not have RegrowComponent",
            );
        });
    });

    describe("Adjacency Requirements", () => {
        function testAdjacentPicking(
            description: string,
            runnerPos: Point,
            resourcePos: Point,
        ) {
            it(description, () => {
                const harness = new JobTestHarness(runnerPos, resourcePos);

                harness.target.setEcsComponent(
                    createResourceComponent(berryBushResource.id),
                );
                harness.target.setEcsComponent(
                    createSpriteComponent(berryBushResource.asset, zeroPoint()),
                );
                harness.target.setEcsComponent(
                    createRegrowComponent(berryBushResource.id),
                );
                harness.runner.setEcsComponent(createInventoryComponent());

                const job = CollectResourceJob(
                    harness.target,
                    ResourceHarvestMode.Pick,
                );
                harness.runner.setEcsComponent({
                    id: JobRunnerComponentId,
                    currentJob: job,
                });

                harness.executeJob(job);

                assert.strictEqual(
                    harness.isJobCompleted(),
                    true,
                    `Should pick resource when ${description}`,
                );
            });
        }

        testAdjacentPicking(
            "adjacent to the right",
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        );
        testAdjacentPicking(
            "adjacent to the left",
            { x: 1, y: 0 },
            { x: 0, y: 0 },
        );
        testAdjacentPicking("adjacent above", { x: 0, y: 1 }, { x: 0, y: 0 });
        testAdjacentPicking("adjacent below", { x: 0, y: 0 }, { x: 0, y: 1 });
    });

    describe("Movement to Target", () => {
        it("moves runner one step closer to resource when not adjacent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 },
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(berryBushResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(berryBushResource.asset, zeroPoint()),
            );
            harness.target.setEcsComponent(
                createRegrowComponent(berryBushResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const initialPosition = { ...harness.runner.worldPosition };

            harness.executeJob(job);

            assert.notDeepStrictEqual(
                harness.runner.worldPosition,
                initialPosition,
                "Runner should have moved",
            );
            assert.strictEqual(
                harness.runner.worldPosition.x,
                1,
                "Runner should have moved to x=1",
            );
        });

        it("moves runner multiple steps until adjacent, then picks resource", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 },
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(berryBushResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(berryBushResource.asset, zeroPoint()),
            );
            harness.target.setEcsComponent(
                createRegrowComponent(berryBushResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job); // Move to x=1
            assert.strictEqual(harness.runner.worldPosition.x, 1);

            harness.executeJob(job); // Move to x=2 (adjacent)
            assert.strictEqual(harness.runner.worldPosition.x, 2);

            // Now adjacent, execute one more time to complete picking (workDuration=1)
            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Should complete after picking",
            );
        });
    });

    describe("Work Progress Tracking", () => {
        it("tracks work progress correctly for berry bush", () => {
            const harness = new JobTestHarness({ x: 0, y: 0 }, { x: 1, y: 0 });

            harness.target.setEcsComponent(
                createResourceComponent(berryBushResource.id),
            );
            harness.target.setEcsComponent(
                createSpriteComponent(berryBushResource.asset, zeroPoint()),
            );
            harness.target.setEcsComponent(
                createRegrowComponent(berryBushResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Pick,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            assert.strictEqual(job.workProgress, 0, "Initial progress: 0");

            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should complete (workDuration = 1)",
            );
        });
    });
});
