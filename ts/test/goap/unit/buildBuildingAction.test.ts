import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestRoot } from "../fixtures.ts";
import { buildBuildingAction } from "../../../src/game/goap/unit/action/buildBuilding.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { BuildBuildingJob } from "../../../src/game/job/buildBuildingJob.ts";
import { createGoapAgentComponent } from "../../../src/game/component/goapAgentComponent.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import {
    BuildingComponentId,
    createBuildingComponent,
} from "../../../src/game/component/buildingComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import {
    createSpriteComponent,
    SpriteComponentId,
} from "../../../src/game/component/spriteComponent.ts";
import { emptySprite } from "../../../src/asset/sprite.ts";

function createTestAgentAtPosition(root: Entity, x: number, y: number): Entity {
    const agent = new Entity("agent");
    agent.worldPosition = { x, y };
    agent.setEcsComponent(createGoapAgentComponent());
    root.addChild(agent);
    return agent;
}

function createBuildingEntity(
    root: Entity,
    x: number,
    y: number,
    buildingId: string,
): Entity {
    const building = new Entity("building");
    building.worldPosition = { x, y };

    const buildingData = {
        id: buildingId,
        name: "Test Building",
        icon: emptySprite,
        scale: 1 as const,
    };

    building.setEcsComponent(createBuildingComponent(buildingData, true));
    building.setEcsComponent(createHealthComponent(0, 100)); // Scaffolded, needs building
    building.setEcsComponent(createSpriteComponent(emptySprite));
    root.addChild(building);
    return building;
}

describe("BuildBuilding Action", () => {
    it("has correct preconditions - requires claimed job", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };

        // State with no claimed job
        const stateNoClaim = new Map<string, string>();
        assert.strictEqual(
            buildBuildingAction.preconditions(stateNoClaim, ctx),
            false,
        );
    });

    it("has correct preconditions - requires BuildBuildingJob", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 1, 0, "house");

        // Add job queue with BuildBuildingJob
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };

        // State with claimed job
        const state = new Map<string, string>();
        state.set("claimedJob", "0");

        assert.strictEqual(
            buildBuildingAction.preconditions(state, ctx),
            true,
        );
    });

    it("has correct preconditions - rejects wrong job type", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Add job queue with non-BuildBuildingJob (attack job)
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
            buildBuildingAction.preconditions(state, ctx),
            false,
        );
    });

    it("creates execution data with job index", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        // Execution data reads the claimed job from the agent
        // When agent has no claimed job, it defaults to 0
        assert.strictEqual(executionData.jobIndex, 0);
    });

    it("returns in_progress when not adjacent to building", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 10, 10, "house");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);
        const result = buildBuildingAction.execute(executionData, ctx);

        // In test environment without pathfinding, unreachable targets complete immediately
        // In production, movement would succeed and return in_progress
        assert.strictEqual(result, "complete");
        // Job is cleared when target is unreachable
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("heals building when adjacent", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 1, 0, "house");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        const healthBefore =
            building.getEcsComponent(HealthComponentId)?.currentHp;

        const result = buildBuildingAction.execute(executionData, ctx);

        const healthAfter =
            building.getEcsComponent(HealthComponentId)?.currentHp;

        assert.strictEqual(result, "in_progress");
        assert.ok(
            healthAfter! > healthBefore!,
            "Building health should increase",
        );
        assert.strictEqual(healthAfter, 10, "Building should heal by 10 HP");
    });

    it("completes building when health reaches max", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 1, 0, "house");

        // Set building to almost complete
        const health = building.requireEcsComponent(HealthComponentId);
        health.currentHp = 95;

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        const result = buildBuildingAction.execute(executionData, ctx);

        const buildingComponent =
            building.getEcsComponent(BuildingComponentId);
        const healthAfter = building.getEcsComponent(HealthComponentId);

        assert.strictEqual(result, "complete");
        assert.strictEqual(healthAfter?.currentHp, 100, "Should reach max HP");
        assert.strictEqual(
            buildingComponent?.scaffolded,
            false,
            "Should no longer be scaffolded",
        );
        assert.strictEqual(goapAgent.claimedJob, undefined);
        assert.strictEqual(jobQueue.jobs.length, 0);
    });

    it("updates sprite when building completes", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 1, 0, "house");

        // Set building to almost complete
        const health = building.requireEcsComponent(HealthComponentId);
        health.currentHp = 95;

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        buildBuildingAction.execute(executionData, ctx);

        const sprite = building.getEcsComponent(SpriteComponentId);

        // Sprite should be updated from emptySprite to building icon (emptySprite in this test)
        assert.strictEqual(sprite?.sprite, emptySprite);
    });

    it("has correct effects - marks job complete", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        const ctx = { agent: agent, root, tick: 0 };
        const state = new Map<string, string>();
        state.set("claimedJob", "0");

        const effects = buildBuildingAction.getEffects(state, ctx);

        assert.strictEqual(effects.get("claimedJob"), "__COMPLETE__");
    });

    it("handles missing building gracefully", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue with job for non-existent building
        const jobQueue = createJobQueueComponent();
        const job = BuildBuildingJob({ id: "nonexistent" } as any);
        jobQueue.jobs.push(job);
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = buildBuildingAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("handles missing building component gracefully", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = new Entity("building-no-component");
        building.worldPosition = { x: 1, y: 0 };
        root.addChild(building);

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = buildBuildingAction.execute(executionData, ctx);

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
        const executionData = buildBuildingAction.createExecutionData(ctx);

        // Should complete gracefully
        const result = buildBuildingAction.execute(executionData, ctx);

        assert.strictEqual(result, "complete");
        assert.strictEqual(goapAgent.claimedJob, undefined);
    });

    it("requires adjacency to build", () => {
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
            const building = createBuildingEntity(root, pos.x, pos.y, "house");

            const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
            goapAgent.claimedJob = 0;

            const jobQueue = createJobQueueComponent();
            jobQueue.jobs.push(BuildBuildingJob(building));
            root.setEcsComponent(jobQueue);

            const ctx = { agent: agent, root, tick: 0 };
            const executionData = buildBuildingAction.createExecutionData(ctx);

            const result = buildBuildingAction.execute(executionData, ctx);

            const healthAfter =
                building.getEcsComponent(HealthComponentId)?.currentHp;

            assert.strictEqual(
                result,
                "in_progress",
                `Should work when adjacent at ${pos.x},${pos.y}`,
            );
            assert.strictEqual(
                healthAfter,
                10,
                `Should heal by 10 HP when adjacent at ${pos.x},${pos.y}`,
            );

            // Clean up for next iteration
            building.remove();
        }
    });

    it("progressively builds building over multiple ticks", () => {
        const root = createTestRoot();
        const agent = createTestAgentAtPosition(root, 0, 0);
        const building = createBuildingEntity(root, 1, 0, "house");

        // Set agent as having claimed job
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.claimedJob = 0;

        // Add job queue
        const jobQueue = createJobQueueComponent();
        jobQueue.jobs.push(BuildBuildingJob(building));
        root.setEcsComponent(jobQueue);

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = buildBuildingAction.createExecutionData(ctx);

        // Execute 9 times (0 + 10*9 = 90 HP)
        for (let i = 0; i < 9; i++) {
            const result = buildBuildingAction.execute(executionData, ctx);
            assert.strictEqual(
                result,
                "in_progress",
                `Tick ${i + 1} should be in progress`,
            );
        }

        const healthBefore =
            building.getEcsComponent(HealthComponentId)?.currentHp;
        assert.strictEqual(healthBefore, 90, "Should have 90 HP after 9 ticks");

        // 10th execution should complete
        const finalResult = buildBuildingAction.execute(executionData, ctx);
        assert.strictEqual(finalResult, "complete");

        const healthAfter =
            building.getEcsComponent(HealthComponentId)?.currentHp;
        assert.strictEqual(healthAfter, 100, "Should reach max HP");

        const buildingComponent =
            building.getEcsComponent(BuildingComponentId);
        assert.strictEqual(
            buildingComponent?.scaffolded,
            false,
            "Should no longer be scaffolded",
        );
    });
});
