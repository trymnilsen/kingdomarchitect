import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import type { BehaviorActionData } from "../behavior/actions/ActionData.ts";

export const BehaviorAgentComponentId = "behavioragent";

/**
 * Player command types that can be issued to behavior agents.
 * These override autonomous behavior with direct player control.
 */
export type PlayerCommand =
    | {
          action: "move";
          targetPosition: Point;
      }
    | {
          action: "attack";
          targetEntityId: string;
      }
    | {
          action: "pickup";
          targetEntityId: string;
      }
    | {
          action: "interact";
          targetEntityId: string;
      }
    | {
          action: "drop";
      }
    | {
          action: "deposit";
      }
    | {
          action: "equip";
          sourceEntityId: string;
          itemId: string;
          slot: "primary" | "secondary";
      }
    | {
          action: "equipFromHeld";
          slot: "primary" | "secondary";
      };

/**
 * Signals that a behavior agent needs to replan on the next tick.
 */
export type PendingReplan = { kind: "replan" };

export interface BehaviorAgentComponent {
    id: typeof BehaviorAgentComponentId;
    /**
     * The behavior whose actions are in actionQueue, so what this agent is
     * doing right now. null whenever there is no active plan. The selection UI
     * reads this, so it is cleared the moment a plan ends. See clearBehavior
     * and concludeActivePlan in BehaviorSystem.
     */
    currentBehaviorName: string | null;
    /**
     * The utility score of the currently-running behavior, set during replan.
     * Used by the displacement system to determine how much resistance this entity
     * offers when another entity wants to displace it.
     */
    currentBehaviorUtility: number;
    actionQueue: BehaviorActionData[];
    /**
     * Planner memory for replan hysteresis (anti-thrashing): the behavior that
     * receives the REPLAN_THRESHOLD bonus on the next selection — normally
     * whatever the planner last picked. Unlike currentBehaviorName, this survives
     * a plan completing normally, so the just-finished behavior is still favored
     * on the next replan; it is reset to null only when a plan ends abnormally
     * (failure / no valid behavior), matching the pre-split behavior where those
     * paths dropped the bonus. Never read by the UI. Wrapped in an object so the
     * field name documents its purpose and it can carry more later if needed.
     */
    hysteresis: { behaviorName: string } | null;
    pendingReplan?: PendingReplan;
    playerCommand?: PlayerCommand;
}

export function createBehaviorAgentComponent(): BehaviorAgentComponent {
    return {
        id: BehaviorAgentComponentId,
        currentBehaviorName: null,
        currentBehaviorUtility: 0,
        actionQueue: [],
        hysteresis: null,
        pendingReplan: { kind: "replan" },
    };
}

export function getBehaviorAgent(
    entity: Entity,
): BehaviorAgentComponent | null {
    return entity.getEcsComponent(BehaviorAgentComponentId);
}

export function requestReplan(entity: Entity): void {
    const agent = getBehaviorAgent(entity);
    if (agent) {
        agent.pendingReplan = { kind: "replan" };
    }
}

/**
 * Consume the pending player command. Both the action that ends a successful
 * command and every path that abandons one (target gone, hands empty, no plan)
 * end here, so the agent stops re-expanding a command it cannot carry out.
 */
export function clearPlayerCommand(entity: Entity): void {
    const agent = getBehaviorAgent(entity);
    if (agent) {
        agent.playerCommand = undefined;
        entity.invalidateComponent(BehaviorAgentComponentId);
    }
}
