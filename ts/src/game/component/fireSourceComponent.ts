/**
 * Component for entities that provide warmth (campfires, braziers).
 * Fires warm entities in adjacent tiles (8 surrounding tiles only).
 *
 * There are two warmth rates because warming is intentionally an active choice:
 *   - activeWarmthRate: applied when a goblin executes the warmByFire action
 *     (i.e. it deliberately sat down to warm up — rapid recovery, ~15/tick)
 *   - passiveWarmthRate: applied by WarmthDecaySystem to entities that happen
 *     to be standing next to fire while doing something else (slow, ~2/tick)
 *
 * This separation means a goblin working near a fire stays comfortable longer
 * without replanning, but a cold goblin that commits to warming recovers quickly.
 */
export type FireSourceComponent = {
    id: typeof FireSourceComponentId;

    /** Warmth gained per tick when actively warming (using warmByFire action) */
    activeWarmthRate: number;

    /** Warmth gained per tick when passively adjacent to fire */
    passiveWarmthRate: number;

    /** Warmth radius in tiles (always 1 for adjacent tiles only) */
    radius: number;

    /** Whether the fire is currently active/lit */
    isActive: boolean;
};

export const FireSourceComponentId = "FireSource";

/**
 * Create a new fire source component.
 */
export function createFireSourceComponent(
    activeWarmthRate: number = 15,
    passiveWarmthRate: number = 2,
    radius: number = 1,
): FireSourceComponent {
    return {
        id: FireSourceComponentId,
        activeWarmthRate,
        passiveWarmthRate,
        radius,
        isActive: true,
    };
}
