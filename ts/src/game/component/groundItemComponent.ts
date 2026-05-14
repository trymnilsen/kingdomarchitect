export type GroundItemComponent = {
    id: typeof GroundItemComponentId;
};

export const GroundItemComponentId = "GroundItem";

export function createGroundItemComponent(): GroundItemComponent {
    return {
        id: GroundItemComponentId,
    };
}
