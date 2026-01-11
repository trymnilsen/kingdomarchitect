import type { Entity } from "../entity/entity.ts";

/**
 * Context provided to GOAP actions and goals for accessing the game state.
 * Contains the agent entity ID and the ECS root for querying components.
 */
export type GoapContext = {
    /** The entity ID of the agent performing the action */
    agent: Entity;
    /** The root entity for querying components and game state */
    root: Entity;
    /** Current game tick (milliseconds) */
    tick: number;
};

export function createGoapContext(
    agent: Entity,
    root: Entity,
    tick: number,
): GoapContext {
    return {
        agent,
        root,
        tick,
    };
}
