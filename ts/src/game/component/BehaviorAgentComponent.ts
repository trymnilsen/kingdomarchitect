import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import type { BehaviorActionData } from "../behavior/actions/Action.ts";

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

export interface BehaviorAgentComponent {
    id: typeof BehaviorAgentComponentId;
    currentBehaviorName: string | null;
    actionQueue: BehaviorActionData[];
    shouldReplan: boolean;
    playerCommand?: PlayerCommand;
}

export function createBehaviorAgentComponent(): BehaviorAgentComponent {
    return {
        id: BehaviorAgentComponentId,
        currentBehaviorName: null,
        actionQueue: [],
        shouldReplan: false,
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
        agent.shouldReplan = true;
    }
}
