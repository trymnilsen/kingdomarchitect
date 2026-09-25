export type VisibilityComponent = {
    id: typeof VisibilityComponentId;
    baseReach: number;
};

export function createVisibilityComponent(
    baseReach: number,
): VisibilityComponent {
    return {
        id: VisibilityComponentId,
        baseReach,
    };
}

export const VisibilityComponentId = "visibility";
