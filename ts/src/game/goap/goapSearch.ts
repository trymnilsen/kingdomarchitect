import { BinaryHeap } from "../../common/structure/binaryHeap.ts";
import type { GoapActionDefinition } from "./goapAction.ts";
import type { GoapContext } from "./goapContext.ts";
import type { GoapGoalDefinition } from "./goapGoal.ts";
import type { GoapPlan } from "./goapPlanner.ts";
import {
    applyEffects,
    cloneWorldState,
    type GoapWorldState,
    worldStatesEqual,
} from "./goapWorldState.ts";

/**
 * A node in the GOAP search space.
 * Each node represents a potential world state that could be reached
 * by executing a sequence of actions.
 */
type GoapSearchNode = {
    /** The world state at this node */
    state: GoapWorldState;

    /** The action that led to this state (null for starting node) */
    action: GoapActionDefinition<any> | null;

    /** Execution data for the action (null for starting node) */
    executionData: unknown;

    /** Parent node in the search tree */
    parent: GoapSearchNode | null;

    /** Actual cost from start to this node (g-score) */
    g: number;

    /** Estimated cost from this node to goal (h-score, heuristic) */
    h: number;

    /** Total estimated cost (f-score = g + h) */
    f: number;
};

/**
 * Create the starting node for A* search.
 */
function createStartNode(initialState: GoapWorldState): GoapSearchNode {
    return {
        state: initialState,
        action: null,
        executionData: null,
        parent: null,
        g: 0,
        h: 0,
        f: 0,
    };
}

/**
 * Reconstruct the plan by walking back through parent pointers.
 * Reverses the path since we walk backwards from goal to start.
 */
function reconstructPlan(node: GoapSearchNode, goalId: string): GoapPlan {
    const steps: Array<{ actionId: string; executionData: unknown }> = [];
    let current: GoapSearchNode | null = node;

    // Walk backwards from goal to start, skipping the initial node (which has no action)
    while (current && current.parent) {
        steps.unshift({
            actionId: current.action!.id,
            executionData: current.executionData,
        });
        current = current.parent;
    }

    return {
        goalId,
        steps,
        totalCost: node.g, // Use actual accumulated cost from A*
    };
}

/**
 * Check if a state exists in the closed set.
 * The closed set tracks world states we've already fully explored.
 *
 * We identify nodes by their world state, not by the specific sequence
 * of actions that led there. If two different action sequences lead to
 * the same world state, we only need to explore one of them.
 *
 * This is a key optimization: in a graph where multiple paths can reach
 * the same state, we only need to explore the cheapest path.
 */
function isInClosedSet(
    closedSet: GoapWorldState[],
    state: GoapWorldState,
): boolean {
    return closedSet.some((closedState) => worldStatesEqual(closedState, state));
}

/**
 * Heuristic function for A* search.
 * Estimates the cost from current state to goal state.
 *
 * For GOAP, creating accurate heuristics is difficult because:
 * 1. Goals are abstract (not spatial like pathfinding)
 * 2. We don't know what actions will be needed without searching
 * 3. State space is typically small enough that heuristics don't help much
 *
 * Using h=0 makes this uniform-cost search (Dijkstra's algorithm), which:
 * - Guarantees finding the optimal (lowest cost) solution
 * - Is acceptable for small state spaces
 * - Avoids the risk of inadmissible heuristics
 *
 * Future improvement: Goals could provide domain-specific heuristics
 * that estimate "distance" to goal satisfaction.
 */
function heuristic(
    _state: GoapWorldState,
    _goal: GoapGoalDefinition,
): number {
    // Return 0 to make A* behave like uniform-cost search
    // This guarantees optimal solutions at the cost of exploring more nodes
    return 0;
}

/**
 * A* search to find a sequence of actions that satisfies a goal.
 *
 * This searches through the space of possible world states to find
 * the lowest-cost sequence of actions that transforms the current state
 * into a state where the goal is satisfied.
 *
 * The search works by:
 * 1. Starting from the current world state
 * 2. Exploring all actions whose preconditions are met
 * 3. Applying action effects to create new states
 * 4. Tracking the cost of each path
 * 5. Stopping when we find a state that satisfies the goal
 *
 * @param ctx - Planning context with agent and world information
 * @param goal - The goal we're trying to satisfy
 * @param actions - All available actions to consider
 * @param getCurrentState - Function to extract current world state from context
 * @param maxNodes - Maximum nodes to explore (prevents infinite loops)
 * @returns A plan if found, null if no plan exists
 */
export function aStarSearch(
    ctx: GoapContext,
    goal: GoapGoalDefinition,
    actions: GoapActionDefinition<any>[],
    getCurrentState: (ctx: GoapContext) => GoapWorldState,
    maxNodes = 1000,
): GoapPlan | null {
    // Get the initial world state from the game world
    const initialState = getCurrentState(ctx);

    // Open set: nodes to be evaluated, ordered by f-score (lowest first)
    // The heap gives us O(log n) insertion and O(log n) extraction of minimum
    const openSet = new BinaryHeap<GoapSearchNode>((node) => node.f);

    // Closed set: world states we've already fully explored
    // We store states (not nodes) because identity is based on state equality
    const closedSet: GoapWorldState[] = [];

    // Start with the current world state
    const startNode = createStartNode(cloneWorldState(initialState));
    startNode.h = heuristic(startNode.state, goal);
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    let nodesExplored = 0;

    // Main A* loop: continue while we have nodes to explore and haven't hit limit
    while (openSet.size > 0 && nodesExplored < maxNodes) {
        // Get the node with lowest f-score (most promising path)
        const currentNode = openSet.pop();
        nodesExplored++;

        // Check if current state satisfies the goal
        // We use the goal's satisfaction check which operates on the actual world
        // plus the simulated state changes we've tracked
        if (goal.isSatisfiedInState(currentNode.state, ctx)) {
            // Found a solution! Reconstruct and return the plan
            return reconstructPlan(currentNode, goal.id);
        }

        // Mark this state as explored so we don't revisit it
        closedSet.push(cloneWorldState(currentNode.state));

        // Explore all possible actions from this state
        for (const action of actions) {
            // Check if action's preconditions are met in the current planned state
            if (!action.preconditionsInState(currentNode.state, ctx)) {
                continue; // Action not available in this state
            }

            // Get the effects this action would have on the world state
            // Effects represent how the action changes the world
            const effects = action.getEffects(currentNode.state, ctx);

            // Apply effects to get the new state after this action
            const newState = applyEffects(currentNode.state, effects);

            // Skip if we've already fully explored this state
            // This prevents cycles and redundant exploration
            if (isInClosedSet(closedSet, newState)) {
                continue;
            }

            // Calculate the cost to reach this new state
            // g-score = cost to reach current node + cost of this action
            const actionCost = action.getCost(ctx);
            const gScore = currentNode.g + actionCost;

            // Create execution data for this action
            // This captures planning decisions that will be used during execution
            const executionData = action.createExecutionData(ctx);

            // Create a new search node for this state
            const newNode: GoapSearchNode = {
                state: newState,
                action,
                executionData,
                parent: currentNode,
                g: gScore,
                h: heuristic(newState, goal),
                f: 0, // Set below
            };
            newNode.f = newNode.g + newNode.h;

            // Add to open set for future exploration
            openSet.push(newNode);
        }
    }

    // No plan found after exploring all reachable states
    if (nodesExplored >= maxNodes) {
        console.warn(
            `GOAP planning hit node limit (${maxNodes}) for goal "${goal.id}"`,
        );
    }

    return null;
}
