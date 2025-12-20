export type RegrowComponent = {
    id: typeof RegrowComponentId;
    resourceId: string;
    harvestedAtTick: number; // -1 means never harvested
};

export function createRegrowComponent(
    resourceId: string,
    harvestedAtTick: number = -1,
): RegrowComponent {
    return {
        id: RegrowComponentId,
        resourceId,
        harvestedAtTick,
    };
}

export const RegrowComponentId = "Regrow";
