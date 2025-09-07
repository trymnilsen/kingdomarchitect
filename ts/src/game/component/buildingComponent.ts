import type { Adjacency } from "../../common/adjacency.js";
import type { Building } from "../../data/building/building.js";

export type BuildingComponent = {
    id: typeof BuildingComponentId;
    building: Building;
    scaffolded: boolean;
    adjacency?: Adjacency;
};

export function createBuildingComponent(
    building: Building,
    scaffolded: boolean,
): BuildingComponent {
    return {
        id: BuildingComponentId,
        building: building,
        scaffolded: scaffolded,
    };
}

export const BuildingComponentId = "building";
