/**
 * Component for entities that provide warmth (campfires, braziers).
 * Fires warm entities on cardinally adjacent tiles. Diagonals do not count.
 *
 * There are two warmth rates because warming is an active choice:
 *   - activeWarmthRate: applied when a goblin executes the warmByFire action
 *     (it sat down to warm up, so recovery is rapid, ~15/tick)
 *   - passiveWarmthRate: applied by the warmth system to entities that happen
 *     to be standing next to fire while doing something else (slow, ~2/tick)
 *
 * A goblin working near a fire stays comfortable longer without replanning,
 * while a cold goblin that commits to warming recovers quickly.
 */
export type FireSourceComponent = {
    id: typeof FireSourceComponentId;

    /** Warmth gained per tick when actively warming (using warmByFire action) */
    activeWarmthRate: number;

    /** Warmth gained per tick when passively adjacent to fire */
    passiveWarmthRate: number;

    /** Whether the fire is currently active/lit */
    isActive: boolean;
};

export const FireSourceComponentId = "FireSource";

export function createFireSourceComponent(
    activeWarmthRate: number = 15,
    passiveWarmthRate: number = 2,
): FireSourceComponent {
    return {
        id: FireSourceComponentId,
        activeWarmthRate,
        passiveWarmthRate,
        isActive: true,
    };
}
