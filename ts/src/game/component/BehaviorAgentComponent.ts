import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import type { ActionFailure } from "../behavior/actions/Action.ts";
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
 * The replanAfterFailure variant carries context about what went wrong
 * so that expand() can branch its action plan accordingly.
 * Having failure context and the replan signal in one field makes it
 * impossible to set one without the other.
 */
export type PendingReplan =
    | { kind: "replan" }
    | { kind: "replanAfterFailure"; failure: ActionFailure; since: number };

export interface BehaviorAgentComponent {
    id: typeof BehaviorAgentComponentId;
    /**
     * The behavior whose actions are currently in actionQueue — i.e. what this
     * agent is doing right now. null whenever there is no active plan (the queue
     * is empty / the agent is idle). This is the single source of truth the
     * selection UI reads, so it is cleared the moment a plan ends — see
     * clearBehavior and concludeActivePlan in BehaviorSystem.
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
