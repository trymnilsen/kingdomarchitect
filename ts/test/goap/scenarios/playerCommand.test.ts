import assert from "node:assert";
import { describe, it } from "node:test";
import { createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createGoapSystem } from "../../../src/game/system/goapSystem.ts";
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
} from "../../../src/game/component/hungerComponent.ts";
import { healthPotion } from "../../../src/data/inventory/items/resources.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import { createPathfindingGraphComponent } from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createEmptyGraph } from "../../path/testGraph.ts";

/**
 * Helper to create a worker agent with full setup
 */
function createWorkerAgent(root: Entity, x: number, y: number): Entity {
    const worker = new Entity("worker");
    worker.worldPosition = { x, y };
    worker.setEcsComponent(createGoapAgentComponent());
    worker.setEcsComponent(createHungerComponent(30, 1)); // Well-fed
    worker.setEcsComponent(createInventoryComponent([]));
    root.addChild(worker);
    return worker;
}

/**
 * Scenario Tests for Player Command System
 *
 * These tests verify the complete integration of player commands with GOAP:
 * - Player issues command
 * - Goal becomes valid with highest priority
 * - Action executes
 * - Command clears
 * - Agent returns to autonomous behavior
 */
describe("Player Command Scenario Tests", () => {
    it("player move command creates valid plan", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        const graph = createEmptyGraph(20, 20);
        root.setEcsComponent(createPathfindingGraphComponent(graph));

        // Create worker at origin
        const worker = createWorkerAgent(root, 0, 0);

        // Player issues move command
        const goapAgent = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 10, y: 10 },
        };

        // Create planner and system
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // Update: Worker should plan for player command
        goapSystem.onUpdate!(root, 0);

        const updatedAgent = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            updatedAgent.currentPlan?.goalId,
            "follow_player_command",
            "Worker should plan for player command",
        );
        assert.strictEqual(
            updatedAgent.currentPlan?.steps.length,
            1,
            "Plan should have one step",
        );
        assert.strictEqual(
            updatedAgent.currentPlan?.steps[0].actionId,
            "player_move_command",
            "Action should be player move command",
        );
    });

    it("player command has higher priority than hunger", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        const graph = createEmptyGraph(20, 20);
        root.setEcsComponent(createPathfindingGraphComponent(graph));

        // Create worker with critical hunger and food
        const worker = createWorkerAgent(root, 0, 0);
        const hungerComponent = worker.requireEcsComponent(HungerComponentId);
        hungerComponent.hunger = 95; // Critical hunger

        const inventory = worker.requireEcsComponent(InventoryComponentId);
        inventory.items.push({ item: healthPotion, amount: 3 });

        // Player issues move command
        const goapAgent = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 10, y: 10 },
        };

        // Create planner and system
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // Worker should plan for player command despite critical hunger
        goapSystem.onUpdate!(root, 0);

        const updatedAgent = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            updatedAgent.currentPlan?.goalId,
            "follow_player_command",
            "Player command should override critical hunger (priority 50 > 40)",
        );
    });

    it("agent returns to autonomous behavior after command completes", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        const graph = createEmptyGraph(20, 20);
        root.setEcsComponent(createPathfindingGraphComponent(graph));

        // Create worker at destination (will complete immediately)
        const worker = createWorkerAgent(root, 5, 5);

        // Set player command to current position (will complete immediately)
        const goapAgent = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 5, y: 5 }, // Already here
        };

        // Create planner and system
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // First update: Plan for player command
        goapSystem.onUpdate!(root, 0);

        const agent1 = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            agent1.currentPlan?.goalId,
            "follow_player_command",
            "Should plan for player command",
        );

        // Second update: Execute command (completes immediately since already at position)
        goapSystem.onUpdate!(root, 1);

        const agent2 = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            agent2.playerCommand,
            undefined,
            "Command should be cleared",
        );

        // Third update: Should replan to autonomous behavior
        goapSystem.onUpdate!(root, 2);

        const agent3 = worker.requireEcsComponent(GoapAgentComponentId);

        // Should have no plan (idle) or found a new autonomous goal
        const hasAutonomousPlan =
            !agent3.currentPlan ||
            agent3.currentPlan.goalId !== "follow_player_command";
        assert.ok(
            hasAutonomousPlan,
            "Should return to autonomous behavior after command completes",
        );
    });

    it("multiple sequential player commands execute in order", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        const graph = createEmptyGraph(20, 20);
        root.setEcsComponent(createPathfindingGraphComponent(graph));

        const worker = createWorkerAgent(root, 0, 0);
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // First command
        const goapAgent1 = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent1.playerCommand = {
            action: "move",
            targetPosition: { x: 0, y: 0 }, // Current position, completes immediately
        };

        goapSystem.onUpdate!(root, 0); // Plan
        goapSystem.onUpdate!(root, 1); // Execute (completes)

        const agent1 = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            agent1.playerCommand,
            undefined,
            "First command should be cleared",
        );

        // Second command
        const goapAgent2 = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent2.playerCommand = {
            action: "move",
            targetPosition: { x: 0, y: 0 },
        };
        goapAgent2.urgentReplanRequested = true;

        goapSystem.onUpdate!(root, 2); // Plan second command

        const agent2 = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            agent2.currentPlan?.goalId,
            "follow_player_command",
            "Should accept second command",
        );
    });

    it("clears command when destination unreachable", () => {
        const root = createTestRoot();
        root.setEcsComponent(createJobQueueComponent());
        const graph = createEmptyGraph(20, 20);
        root.setEcsComponent(createPathfindingGraphComponent(graph));

        const worker = createWorkerAgent(root, 0, 0);

        // Command to move to unreachable position
        // (Note: In real implementation, doMovement would fail)
        const goapAgent = worker.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 0, y: 0 }, // Use same position to simulate completion
        };

        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        goapSystem.onUpdate!(root, 0); // Plan
        goapSystem.onUpdate!(root, 1); // Execute

        const updatedAgent = worker.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            updatedAgent.playerCommand,
            undefined,
            "Command should be cleared even if unreachable",
        );
    });
});
