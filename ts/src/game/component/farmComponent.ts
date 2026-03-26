export const FarmState = {
    Empty: "empty",
    Growing: "growing",
    Ready: "ready",
} as const;

export type FarmState = (typeof FarmState)[keyof typeof FarmState];

export type FarmComponent = {
    id: typeof FarmComponentId;
    state: FarmState;
    /** The game tick when the crop was planted */
    plantedAtTick: number;
    /** Duration in ticks for the crop to fully grow */
    growthDuration: number;
    /** The item ID that will be yielded on harvest */
    cropItemId: string;
    /** Number of items yielded per harvest */
    cropYieldAmount: number;
};

export const FarmComponentId = "Farm" as const;

export function createFarmComponent(): FarmComponent {
    return {
        id: FarmComponentId,
        state: FarmState.Empty,
        plantedAtTick: 0,
        growthDuration: 60,
        cropItemId: "wheat",
        cropYieldAmount: 4,
    };
}
