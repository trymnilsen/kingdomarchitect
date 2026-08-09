import type { Entity } from "../entity/entity.ts";

/**
 * Anything that can answer "what is the current monotonic tick". The server's
 * `GameTime` class satisfies this shape as-is. Tests can hand in any small
 * object that complies.
 */
export interface GameTimeSource {
    readonly tick: number;
}

/**
 * Root component exposing the current tick to code that only holds an entity,
 * such as behaviors. It holds a live reference to the time source the server
 * already updates every tick, so there is no per-tick stamping and no second
 * counter that could drift.
 *
 * This bends the components-are-pure-data rule on purpose. That rule exists
 * for serialization and replication, and this component takes part in neither:
 * root replication is allowlist-based and persistence is whitelist-based, so
 * the reference never crosses a serializer. The authoritative tick is saved in
 * the world meta instead.
 */
export type GameTimeComponent = {
    id: typeof GameTimeComponentId;
    time: GameTimeSource;
};

export function createGameTimeComponent(
    time: GameTimeSource,
): GameTimeComponent {
    return {
        id: GameTimeComponentId,
        time,
    };
}

/**
 * The current tick as seen from the root entity. Returns 0 when no time source
 * is attached, which keeps headless unit tests working without wiring one up.
 */
export function getGameTimeTick(root: Entity): number {
    const component = root.getEcsComponent(GameTimeComponentId);
    if (!component) {
        return 0;
    }
    return component.time.tick;
}

export const GameTimeComponentId = "gameTime";
