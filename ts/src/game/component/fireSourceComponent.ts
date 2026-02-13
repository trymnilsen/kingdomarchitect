/**
 * Component for entities that provide warmth (campfires, braziers).
 * Fires warm entities in adjacent tiles (8 surrounding tiles only).
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
