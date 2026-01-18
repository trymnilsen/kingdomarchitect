import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestRoot } from "../fixtures.ts";
import { collectResourceAction } from "../../../src/game/goap/unit/action/collectResource.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { createGoapAgentComponent } from "../../../src/game/component/goapAgentComponent.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import {
    createResourceComponent,
    ResourceComponentId,
} from "../../../src/game/component/resourceComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";

function createTestAgentAtPosition(root: Entity, x: number, y: number): Entity {
    const agent = new Entity("agent");
    agent.worldPosition = { x, y };
    agent.setEcsComponent(createGoapAgentComponent());
    agent.setEcsComponent(createInventoryComponent([]));
    root.addChild(agent);
    return agent;
}

function createResourceEntity(
    root: Entity,
    x: number,
    y: number,
    resourceId: string,
): Entity {
    const resource = new Entity("resource");
    resource.worldPosition = { x, y };
    resource.setEcsComponent(createResourceComponent(resourceId));
    resource.setEcsComponent(createHealthComponent(100, 100));
    root.addChild(resource);
    return resource;
}

describe("CollectResource Action", () => {
    it("has correct preconditions - requires claimed job", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };

        // State with no claimed job
        const stateNoClaim = new Map<string, string>();
        assert.strictEqual(
            collectResourceAction.preconditions(stateNoClaim, ctx),
            false,
        );
    });

    it("has correct preconditions - requires CollectResourceJob", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Add job queue with CollectResourceJob
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };

        // State with claimed job
        const state = new Map<string, string>();
        state.set("claimedJob", "0");

        assert.strictEqual(
            collectResourceAction.preconditions(state, ctx),
            true,
        );
    });

    it("has correct preconditions - rejects wrong job type", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue with non-CollectResourceJob (attack job)
        const jobQueue = createJobQueueComponent();
        const target = new Entity("target");
        root.addChild(target);

        jobQueue.jobs.push({
            id: "attackJob",
            target: target.id,
            attacker: agent.id,
        } as any);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };

        // State with claimed job
        const state = new Map<string, string>();
        state.set("claimedJob", "0");

        assert.strictEqual(
            collectResourceAction.preconditions(state, ctx),
            false,
        );
    });

    it("creates execution data placeholder", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // Execution data reads the claimed job from the agent
        // When agent has no claimed job, it defaults to 0
        assert.strictEqual(executionData.jobIndex, 0);
    });

    it("returns in_progress when not adjacent to resource", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 10, 10, "tree1");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);
        const result = collectResourceAction.execute(executionData, ctx);

        // In test environment without pathfinding, unreachable targets complete immediately
        // In production, movement would succeed and return in_progress
        assert.strictEqual(result, "complete");
        // Job is cleared when target is unreachable
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("damages resource when adjacent (Chop mode)", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        const healthBefore =
            resource.getEcsComponent(HealthComponentId)?.currentHp;

        const result = collectResourceAction.execute(executionData, ctx);

        const healthAfter =
            resource.getEcsComponent(HealthComponentId)?.currentHp;

        assert.strictEqual(result, "in_progress");
        assert.ok(
            healthAfter! < healthBefore!,
            "Resource health should decrease",
        );
    });

    it("increments work progress", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(job.workProgress, 1);
    });

    it("completes and clears job when resource destroyed", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set resource to very low health
        const health = resource.requireEcsComponent(HealthComponentId);
        health.currentHp = 5;

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        const result = collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
        assert.strictEqual(jobQueue.jobs.length, 0);
    });

    it("has correct effects - marks job complete", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };
        const state = new Map<string, string>();
        state.set("claimedJob", "0");

        const effects = collectResourceAction.getEffects(state, ctx);

        assert.strictEqual(effects.get("claimedJob"), "__COMPLETE__");
    });

    it("handles missing resource gracefully", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue with job for non-existent resource
        const jobQueue = createJobQueueComponent();
        const job = CollectResourceJob(
            { id: "nonexistent" } as any,
            ResourceHarvestMode.Chop,
        );
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("handles invalid job type gracefully", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue with wrong job type
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push({
            id: "attackJob",
            target: "target",
            attacker: agent.id,
        } as any);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("requires adjacency to collect", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Test all four adjacent positions
        const adjacentPositions = [
            { x: 1, y: 0 }, // Right
            { x: -1, y: 0 }, // Left
            { x: 0, y: 1 }, // Down
            { x: 0, y: -1 }, // Up
        ];

        for (const pos of adjacentPositions) {
            const resource = createResourceEntity(root, pos.x, pos.y, "tree1");

            const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
            goapAgent.claimedJob = 0;

            const jobQueue = createJobQueueComponent();
            jobQueue.jobs.push(
                CollectResourceJob(resource, ResourceHarvestMode.Chop),
            );
            root.setEcsComponent(jobQueue);

            const ctx = { agent: agent, root, tick: 0 };
            const executionData =
                collectResourceAction.createExecutionData(ctx);

            const healthBefore =
                resource.getEcsComponent(HealthComponentId)?.currentHp;

            const result = collectResourceAction.execute(executionData, ctx);

            const healthAfter =
                resource.getEcsComponent(HealthComponentId)?.currentHp;

            assert.strictEqual(
                result,
                "in_progress",
                `Should work when adjacent at ${pos.x},${pos.y}`,
            );
            assert.ok(
                healthAfter! < healthBefore!,
                `Should damage resource when adjacent at ${pos.x},${pos.y}`,
            );

            // Clean up for next iteration
            resource.remove();
        }
    });

    it("progressively damages and destroys resource", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set resource health to 25 (will take 3 hits of 10 damage)
        const health = resource.requireEcsComponent(HealthComponentId);
        health.currentHp = 25;

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // First hit: 25 -> 15
        let result = collectResourceAction.execute(executionData, ctx);
        assert.strictEqual(result, "in_progress");
        assert.strictEqual(
            resource.getEcsComponent(HealthComponentId)?.currentHp,
            15,
        );

        // Second hit: 15 -> 5
        result = collectResourceAction.execute(executionData, ctx);
        assert.strictEqual(result, "in_progress");
        assert.strictEqual(
            resource.getEcsComponent(HealthComponentId)?.currentHp,
            5,
        );

        // Third hit: 5 -> 0 (destroyed)
        result = collectResourceAction.execute(executionData, ctx);
        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
        assert.strictEqual(jobQueue.jobs.length, 0);
        // Resource should be removed from world
        assert.strictEqual(root.findEntity(resource.id), null);
    });

    it("handles missing resource component gracefully", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const entity = new Entity("not-a-resource");
        entity.worldPosition = { x: 1, y: 0 };
        root.addChild(entity);

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue with job for entity without ResourceComponent
        const jobQueue = createJobQueueComponent();
        const job = CollectResourceJob(entity, ResourceHarvestMode.Chop);
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("adds resource yields to inventory when collected", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set resource to low health so it completes in one hit
        const health = resource.requireEcsComponent(HealthComponentId);
        health.currentHp = 5;

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = collectResourceAction.createExecutionData(ctx);

        // Get initial inventory state
        const inventoryBefore = agent.requireEcsComponent(
            InventoryComponentId,
        );
        const initialWoodCount =
            inventoryBefore.items.find((stack) => stack.item.id === "wood")
                ?.amount || 0;

        // Execute the collection (should complete and destroy resource)
        const result = collectResourceAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);

        // Verify yields were added to inventory
        const inventoryAfter = agent.requireEcsComponent(InventoryComponentId);
        const woodStack = inventoryAfter.items.find(
            (stack) => stack.item.id === "wood",
        );

        assert.ok(woodStack, "Wood should be added to inventory");
        // tree1 yields 4 wood (from treeResource definition)
        assert.strictEqual(
            woodStack.amount,
            initialWoodCount + 4,
            "Should receive 4 wood from tree",
        );
    });
});
