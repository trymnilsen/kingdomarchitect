/**
 * Component that links a goblin to its camp.
 * Used to identify which camp a goblin belongs to.
 */
export type GoblinUnitComponent = {
    id: typeof GoblinUnitComponentId;

    /** Entity ID of the parent camp */
    campEntityId: string;
};

export const GoblinUnitComponentId = "GoblinUnit";

/**
 * Create a new goblin unit component.
 */
export function createGoblinUnitComponent(
    campEntityId: string,
): GoblinUnitComponent {
    return {
        id: GoblinUnitComponentId,
        campEntityId,
    };
}
