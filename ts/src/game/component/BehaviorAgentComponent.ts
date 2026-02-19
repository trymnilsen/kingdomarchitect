import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import type { ActionFailure, BehaviorActionData } from "../behavior/actions/Action.ts";

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
    currentBehaviorName: string | null;
    actionQueue: BehaviorActionData[];
    pendingReplan?: PendingReplan;
    playerCommand?: PlayerCommand;
}

export function createBehaviorAgentComponent(): BehaviorAgentComponent {
    return {
        id: BehaviorAgentComponentId,
        currentBehaviorName: null,
        actionQueue: [],
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
