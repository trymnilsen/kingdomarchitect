import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
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
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";

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

describe("Job Workflow Integration", () => {
    it("plans to claim job when jobs are available", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 5, 5, "tree1");

        // Add job queue with unclaimed job
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null, "Should create a plan");
        assert.strictEqual(plan.goalId, "be_productive");
        assert.ok(plan.steps.length > 0, "Plan should have steps");
        assert.ok(
            plan.steps[0].actionId.startsWith("claim_job_"),
            "First step should be claim action",
        );
    });

    it("creates plan with claim then collect steps", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Add job queue with unclaimed job
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null, "Should create a plan");
        assert.strictEqual(plan.steps.length, 2);
        assert.ok(plan.steps[0].actionId.startsWith("claim_job_"));
        assert.strictEqual(plan.steps[1].actionId, "collect_resource");
    });

    it("selects closest job when multiple jobs available", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Create two resources at different distances
        const closeResource = createResourceEntity(root, 1, 0, "tree1");
        const farResource = createResourceEntity(root, 100, 100, "tree1");

        // Add job queue with both jobs
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(closeResource, ResourceHarvestMode.Chop),
        );
        jobQueue.jobs.push(
            CollectResourceJob(farResource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null, "Should create a plan");
        // Should claim job 0 (closer resource)
        assert.strictEqual(plan.steps[0].actionId, "claim_job_0");
    });

    it("does not plan for jobs when already have claimed job", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set agent as having claimed a job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        (job as any).claimedBy = agent.id;
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null, "Should create a plan");
        // Should plan to collect resource, not claim another job
        assert.strictEqual(plan.steps[0].actionId, "collect_resource");
    });

    it("executes claim action and updates agent state", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 5, 5, "tree1");

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null);

        // Execute claim action
        const claimStep = plan.steps[0];
        const claimAction = planner.getAction(claimStep.actionId);
        assert.ok(claimAction !== null);

        const result = (claimAction.execute as any)(
            claimStep.executionData,
            ctx,
        );

        assert.strictEqual(result, "complete");

        const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
        assert.strictEqual(goapAgent?.claimedJob, 0);

        const job = jobQueue.jobs[0] as any;
        assert.strictEqual(job.claimedBy, agent.id);
    });

    it("prefers work over idle when jobs available", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 5, 5, "tree1");

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null);
        // Should choose be_productive (priority 20) over idle (priority 1)
        assert.strictEqual(plan.goalId, "be_productive");
    });

    it("falls back to idle when no jobs available", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add empty job queue
        root.setEcsComponent(createJobQueueComponent());

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null);
        // Should fall back to idle goal
        assert.strictEqual(plan.goalId, "idle");
    });

    it("dynamic actions are regenerated each planning cycle", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource1 = createResourceEntity(root, 5, 5, "tree1");

        // Add job queue with one job
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource1, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };

        // First plan - should have one claim action
        const plan1 = planner.plan(ctx);
        assert.ok(plan1 !== null);
        assert.strictEqual(plan1.steps[0].actionId, "claim_job_0");

        // Add another job
        const resource2 = createResourceEntity(root, 3, 3, "tree1");
        jobQueue.jobs.push(
            CollectResourceJob(resource2, ResourceHarvestMode.Chop),
        );

        // Second plan - should now have two claim actions available
        const plan2 = planner.plan(ctx);
        assert.ok(plan2 !== null);
        // Should pick the closer job (resource2 at 3,3 vs resource1 at 5,5)
        // Claim actions are generated fresh, so planner can choose between them
        assert.ok(plan2.steps[0].actionId.startsWith("claim_job_"));
    });

    it("skips jobs constrained to other agents", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const otherAgent = new Entity("other-agent");
        otherAgent.worldPosition = { x: 10, y: 10 };
        otherAgent.setEcsComponent(createGoapAgentComponent());
        otherAgent.setEcsComponent(createInventoryComponent([]));
        root.addChild(otherAgent);

        const resource1 = createResourceEntity(root, 5, 5, "tree1");
        const resource2 = createResourceEntity(root, 3, 3, "tree1");

        // Add job queue with one constrained job and one unconstrained
        const jobQueue = createJobQueueComponent();

        // Job 0: constrained to other agent
        const job1 = CollectResourceJob(resource1, ResourceHarvestMode.Chop);
        job1.constraint = { type: "entity", id: "other-agent" };
        jobQueue.jobs.push(job1);

        // Job 1: unconstrained
        jobQueue.jobs.push(
            CollectResourceJob(resource2, ResourceHarvestMode.Chop),
        );

        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan !== null);
        // Should claim job 1 (unconstrained), not job 0 (constrained to other)
        assert.strictEqual(plan.steps[0].actionId, "claim_job_1");
    });

    it("complete workflow: plan, claim, and collect", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const resource = createResourceEntity(root, 1, 0, "tree1");

        // Set resource to low health so it completes quickly
        const health = resource.requireEcsComponent(HealthComponentId);
        health.currentHp = 5;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };

        // Step 1: Plan
        const plan = planner.plan(ctx);
        assert.ok(plan !== null);
        assert.strictEqual(plan.steps.length, 2);

        // Step 2: Execute claim action
        const claimStep = plan.steps[0];
        const claimAction = planner.getAction(claimStep.actionId);
        assert.ok(claimAction !== null);

        const claimResult = (claimAction.execute as any)(
            claimStep.executionData,
            ctx,
        );
        assert.strictEqual(claimResult, "complete");

        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(goapAgent.claimedJob, 0);

        // Step 3: Execute collect action
        const collectStep = plan.steps[1];
        const collectAction = planner.getAction(collectStep.actionId);
        assert.ok(collectAction !== null);

        const collectResult = (collectAction.execute as any)(
            collectStep.executionData,
            ctx,
        );
        assert.strictEqual(collectResult, "complete");

        // Verify job is complete
        assert.strictEqual(goapAgent.claimedJob, undefined);
        assert.strictEqual(jobQueue.jobs.length, 0);
    });
});
