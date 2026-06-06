import type { CropId } from "../../data/crop/cropDefinitions.ts";

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
    /**
     * Which crop this farm grows. The only configurable piece of farm state;
     * output item, yield, and growth duration are derived from this via
     * getCropDefinition rather than stored, so balancing changes reach every farm.
     */
    cropId: CropId;
};

export const FarmComponentId = "Farm" as const;

export function createFarmComponent(cropId: CropId = "wheat"): FarmComponent {
    return {
        id: FarmComponentId,
        state: FarmState.Empty,
        plantedAtTick: 0,
        cropId,
    };
}
