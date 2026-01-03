import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestRoot } from "../fixtures.ts";
import { generateClaimOrderActions } from "../../../src/game/goap/unit/action/claimOrder.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { createGoapAgentComponent } from "../../../src/game/component/goapAgentComponent.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import { BuildBuildingJob } from "../../../src/game/job/buildBuildingJob.ts";
import { AttackJob } from "../../../src/game/job/attackJob.ts";

function createTestAgentAtPosition(
    root: Entity,
    x: number,
    y: number,
): Entity {
    const agent = new Entity("agent");
    agent.worldPosition = { x, y };
    agent.setEcsComponent(createGoapAgentComponent());
    root.addChild(agent);
    return agent;
}

describe("ClaimOrder Action Generator", () => {
    it("generates no actions when no jobs exist", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add empty job queue
        root.setEcsComponent(createJobQueueComponent());

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 0);
    });

    it("generates one action per unclaimed job", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue with 3 unclaimed jobs
        const jobQueue = createJobQueueComponent();
        const resource1 = new Entity("tree1");
        resource1.worldPosition = { x: 5, y: 5 };
        const resource2 = new Entity("tree2");
        resource2.worldPosition = { x: 10, y: 10 };
        const resource3 = new Entity("tree3");
        resource3.worldPosition = { x: 15, y: 15 };

        root.addChild(resource1);
        root.addChild(resource2);
        root.addChild(resource3);

        jobQueue.jobs.push(
            CollectResourceJob(resource1, ResourceHarvestMode.Chop),
        );
        jobQueue.jobs.push(
            CollectResourceJob(resource2, ResourceHarvestMode.Chop),
        );
        jobQueue.jobs.push(
            CollectResourceJob(resource3, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 3);
        assert.strictEqual(actions[0].id, "claim_job_0");
        assert.strictEqual(actions[1].id, "claim_job_1");
        assert.strictEqual(actions[2].id, "claim_job_2");
    });

    it("skips already claimed jobs", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue with one unclaimed and one claimed job
        const jobQueue = createJobQueueComponent();
        const resource1 = new Entity("tree1");
        resource1.worldPosition = { x: 5, y: 5 };
        const resource2 = new Entity("tree2");
        resource2.worldPosition = { x: 10, y: 10 };

        root.addChild(resource1);
        root.addChild(resource2);

        const job1 = CollectResourceJob(resource1, ResourceHarvestMode.Chop);
        (job1 as any).claimedBy = "other-agent";

        jobQueue.jobs.push(job1);
        jobQueue.jobs.push(
            CollectResourceJob(resource2, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].id, "claim_job_1"); // Second job (index 1)
    });

    it("respects entity constraints", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const otherAgent = new Entity("other-agent");
        otherAgent.worldPosition = { x: 0, y: 0 };
        otherAgent.setEcsComponent(createGoapAgentComponent());
        root.addChild(otherAgent);

        // Add job with entity constraint
        const jobQueue = createJobQueueComponent();
        const target = new Entity("target");
        target.worldPosition = { x: 5, y: 5 };
        root.addChild(target);

        // Job constrained to other-agent
        const job = AttackJob("other-agent", target.id);
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        // Should generate no actions because job is constrained to other-agent
        assert.strictEqual(actions.length, 0);
    });

    it("includes jobs constrained to this agent", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job with entity constraint matching this agent
        const jobQueue = createJobQueueComponent();
        const target = new Entity("target");
        target.worldPosition = { x: 5, y: 5 };
        root.addChild(target);

        // Job constrained to this agent
        const job = AttackJob(agent.id, target.id);
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        // Should generate action because job is constrained to this agent
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].id, "claim_job_0");
    });

    it("calculates cost based on distance and queue position", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue with jobs at different distances
        const jobQueue = createJobQueueComponent();

        // Job 0: distance 5 (closer)
        const resource1 = new Entity("tree1");
        resource1.worldPosition = { x: 3, y: 4 }; // Distance ~5
        root.addChild(resource1);

        // Job 1: distance 10 (farther)
        const resource2 = new Entity("tree2");
        resource2.worldPosition = { x: 6, y: 8 }; // Distance ~10
        root.addChild(resource2);

        jobQueue.jobs.push(
            CollectResourceJob(resource1, ResourceHarvestMode.Chop),
        );
        jobQueue.jobs.push(
            CollectResourceJob(resource2, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 2);

        // First job should be cheaper (baseCost=10 + distance=5 + queuePos=0 = 15)
        const cost0 = actions[0].getCost(ctx);
        // Second job should be more expensive (baseCost=10 + distance=10 + queuePos=1 = 21)
        const cost1 = actions[1].getCost(ctx);

        assert.ok(cost0 < cost1, "Closer job should have lower cost");
    });

    it("claim action sets claimedJob on agent", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        resource.worldPosition = { x: 5, y: 5 };
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        // Execute the claim action
        const claimAction = actions[0];
        const executionData = claimAction.createExecutionData(ctx);
        const result = claimAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");

        const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
        assert.strictEqual(goapAgent?.claimedJob, "0");
    });

    it("claim action marks job as claimed", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        resource.worldPosition = { x: 5, y: 5 };
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        // Execute the claim action
        const claimAction = actions[0];
        const executionData = claimAction.createExecutionData(ctx);
        claimAction.execute(executionData, ctx);

        const job = jobQueue.jobs[0] as any;
        assert.strictEqual(job.claimedBy, agent.id);
    });

    it("claim action has correct preconditions", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        resource.worldPosition = { x: 5, y: 5 };
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        const claimAction = actions[0];

        // Should be available when no claimed job
        const stateNoClaim = new Map<string, string>();
        assert.strictEqual(claimAction.preconditions(stateNoClaim, ctx), true);

        // Should not be available when already have claimed job
        const stateWithClaim = new Map<string, string>();
        stateWithClaim.set("claimedJob", "0");
        assert.strictEqual(
            claimAction.preconditions(stateWithClaim, ctx),
            false,
        );
    });

    it("claim action has correct effects", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        resource.worldPosition = { x: 5, y: 5 };
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        const claimAction = actions[0];
        const state = new Map<string, string>();
        const effects = claimAction.getEffects(state, ctx);

        assert.strictEqual(effects.get("claimedJob"), "0");
    });

    it("handles job types correctly - CollectResource", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        resource.worldPosition = { x: 5, y: 5 };
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 1);
        assert.ok(actions[0].name.includes("chopTreeJob"));
    });

    it("handles job types correctly - BuildBuilding", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const jobQueue = createJobQueueComponent();
        const building = new Entity("building");
        building.worldPosition = { x: 5, y: 5 };
        root.addChild(building);

        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const actions = generateClaimOrderActions(ctx);

        assert.strictEqual(actions.length, 1);
        assert.ok(actions[0].name.includes("buildBuildingJob"));
    });
});
