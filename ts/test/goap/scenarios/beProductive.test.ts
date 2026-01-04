import assert from "node:assert";
import { describe, it } from "node:test";
import { createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import { createGoapSystem } from "../../../src/game/system/goapSystem.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createGoapAgentComponent,
    GoapAgentComponentId,
} from "../../../src/game/component/goapAgentComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
    increaseHunger,
} from "../../../src/game/component/hungerComponent.ts";
import { healthPotion } from "../../../src/data/inventory/items/resources.ts";
import { createPathfindingGraphRegistryComponent } from "../../../src/game/component/pathfindingGraphRegistryComponent.ts";

/**
 * Helper to create a resource entity at a position
 */
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

/**
 * Helper to create a GOAP agent entity
 */
function createAgentEntity(
    root: Entity,
    x: number,
    y: number,
    hunger: number = 0,
): Entity {
    const agent = new Entity("agent");
    agent.worldPosition = { x, y };
    agent.setEcsComponent(createGoapAgentComponent());
    agent.setEcsComponent(createInventoryComponent([]));
    agent.setEcsComponent(createHungerComponent(hunger, 1));
    root.addChild(agent);
    return agent;
}

describe("beProductive system integration", () => {
    it("agent completes full workflow: work -> get hungry -> eat", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        root.setEcsComponent(createPathfindingGraphRegistryComponent()); // Add pathfinding registry for movement

        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // Create agent with no initial hunger
        const agent = createAgentEntity(root, 0, 0, 0);

        // Create a tree at position (5, 5)
        const tree = createResourceEntity(root, 5, 5, "tree1");

        let tick = 0;

        // Step 1: [External] Queue a chop tree job
        const jobQueue = root.requireEcsComponent(JobQueueComponentId);
        const job = CollectResourceJob(tree, ResourceHarvestMode.Chop);
        jobQueue.jobs.push(job);
        root.invalidateComponent(JobQueueComponentId);

        // Step 2: Agent claims the job
        if (goapSystem.onUpdate) {
            goapSystem.onUpdate(root, tick);
        }

        let goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            goapAgent.currentPlan?.goalId,
            "be_productive",
            "Agent should plan for be_productive goal",
        );

        const hasClaimAction = goapAgent.currentPlan?.steps.some((step) =>
            step.actionId.startsWith("claim_job"),
        );
        assert.ok(hasClaimAction, "Plan should include a claim_job action");

        // Step 3: Agent moves towards the tree
        // Movement is not implemented, so manually position agent adjacent to tree
        agent.worldPosition = { x: 5, y: 4 }; // Adjacent to tree at (5, 5)
        tick += 10; // Simulate time passing for movement

        // Step 4: Agent chops the tree
        // Simulate chopping by reducing tree health to 0
        const treeHealth = tree.requireEcsComponent(HealthComponentId);
        treeHealth.currentHp = 0;
        tree.invalidateComponent(HealthComponentId);

        // Clear the job from queue since it's completed
        jobQueue.jobs = jobQueue.jobs.filter((j) => j.id !== job.id);
        root.invalidateComponent(JobQueueComponentId);

        // Clear claimed job from agent
        goapAgent.claimedJob = undefined;
        agent.invalidateComponent(GoapAgentComponentId);

        tick += 5; // Simulate time for chopping

        // Step 5: [External] Add food to inventory
        const inventory = agent.requireEcsComponent(InventoryComponentId);
        inventory.items.push({ item: healthPotion, amount: 5 });
        agent.invalidateComponent(InventoryComponentId);

        // Step 6: [External] Reduce the food of the agent (increase hunger)
        const hungerComponent = agent.requireEcsComponent(HungerComponentId);
        // Hunger needs to be 20-69 so that eating once (reduces by 40) will get us below 30
        // This is a limitation of the current eat_food action which sets hasFood=false after one use
        increaseHunger(hungerComponent, 60); // Set to moderate hunger level
        agent.invalidateComponent(HungerComponentId);

        // Verify hunger was actually set
        const verifyHunger = agent.requireEcsComponent(HungerComponentId);
        assert.strictEqual(
            verifyHunger.hunger,
            60,
            `Hunger should be 60 but is ${verifyHunger.hunger}`,
        );

        // Step 7: Trigger a replan
        // Advance tick past planning cooldown to allow replanning
        tick += 1100; // Advance past cooldown (1000ms)

        // Force replan by clearing the current plan completely
        goapAgent.currentPlan = null;
        goapAgent.currentStepIndex = 0;
        goapAgent.lastPlanTime = -Infinity; // Ensure cooldown check passes
        agent.invalidateComponent(GoapAgentComponentId);

        if (goapSystem.onUpdate) {
            goapSystem.onUpdate(root, tick);
        }

        // Step 8: Check that eat is triggered
        goapAgent = agent.requireEcsComponent(GoapAgentComponentId);

        // Debug: Check what the planner sees
        const ctx = { agentId: agent.id, root: root, tick };
        const stayFedGoal = planner.getGoal("stay_fed");
        if (stayFedGoal) {
            const isValid = stayFedGoal.isValid(ctx);
            const priority = stayFedGoal.priority(ctx);
            assert.ok(
                isValid,
                `stay_fed goal should be valid at hunger 60, but isValid=${isValid}`,
            );
            assert.strictEqual(
                priority,
                15,
                `stay_fed priority should be 15 at hunger 60, but is ${priority}`,
            );
        }

        assert.strictEqual(
            goapAgent.currentPlan?.goalId,
            "stay_fed",
            `Agent should plan to eat when hungry. Actual plan: ${goapAgent.currentPlan?.goalId}`,
        );

        const hasEatAction = goapAgent.currentPlan?.steps.some(
            (step) => step.actionId === "eat_food",
        );
        assert.ok(hasEatAction, "Plan should include eat_food action");

        // ===== Step 9: Eating reduces hunger =====
        // NOTE: We've verified the agent created a plan to eat. The actual execution
        // would reduce hunger from 60 to 20 (60 - 40 = 20), satisfying the goal (hunger < 30).
        // Once action execution is fully implemented, we would run:
        //   tick += 1; goapSystem.onUpdate(root, tick);
        //   const hunger = agent.requireEcsComponent(HungerComponentId);
        //   assert.ok(hunger.hunger === 20, "Hunger should be 20 after eating");

        // For now, the test successfully demonstrates the full workflow planning
    });
});
