import type { Building } from "../../data/building/building.js";

export type BuildingComponent = {
    id: typeof BuildingComponentId;
    building: Building;
};

export function createBuildingComponent(building: Building): BuildingComponent {
    return {
        id: BuildingComponentId,
        building: building,
    };
}

export const BuildingComponentId = "building";
