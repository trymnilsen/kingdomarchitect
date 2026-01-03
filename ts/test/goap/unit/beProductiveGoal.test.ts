import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { createGoapAgentComponent } from "../../../src/game/component/goapAgentComponent.ts";

function createTestAgentWithJob(root: Entity): Entity {
    const agent = new Entity("agent");
    agent.setEcsComponent(createGoapAgentComponent());
    root.addChild(agent);
    return agent;
}

describe("BeProductive Goal", () => {
    it("is valid when there are unclaimed jobs", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        // Add job queue with unclaimed job
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        root.addChild(resource);

        jobQueue.jobs.push(
            CollectResourceJob(resource, ResourceHarvestMode.Chop),
        );
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), true);
    });

    it("is valid when agent has claimed a job", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        // Set agent as having claimed a job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = "0";

        // Add job queue with claimed job
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        (job as any).claimedBy = agent.id;
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), true);
    });

    it("is not valid when no jobs exist", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        // Add empty job queue
        root.setEcsComponent(createJobQueueComponent());

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), false);
    });

    it("is not valid when all jobs are claimed by others", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        // Add job queue with job claimed by another agent
        const jobQueue = createJobQueueComponent();
        const resource = new Entity("tree");
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        (job as any).claimedBy = "other-agent";
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), false);
    });

    it("is never satisfied at runtime", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };

        // Goal is never satisfied - it's either valid (work to do) or invalid (no work)
        assert.strictEqual(goal?.isSatisfied(ctx), false);
    });

    it("wouldBeSatisfiedBy returns false when claimedJob exists", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };

        // State with claimed job - still have work to do
        const state = new Map<string, string>();
        state.set("claimedJob", "0");
        assert.strictEqual(goal?.wouldBeSatisfiedBy(state, ctx), false);
    });

    it("wouldBeSatisfiedBy returns true when job is complete", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };

        // State with completed job marker
        const state = new Map<string, string>();
        state.set("claimedJob", "__COMPLETE__");
        assert.strictEqual(goal?.wouldBeSatisfiedBy(state, ctx), true);
    });

    it("wouldBeSatisfiedBy returns false when no claimedJob", () => {
        const root = createTestRoot();
        const agent = createTestAgentWithJob(root);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("be_productive");

        const ctx = { agentId: agent.id, root, tick: 0 };

        // State with no claimed job - haven't started work yet
        const state = new Map<string, string>();
        assert.strictEqual(goal?.wouldBeSatisfiedBy(state, ctx), false);
    });
});
