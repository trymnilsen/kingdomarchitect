import type { Adjacency } from "../../common/adjacency.ts";
import type { Building } from "../../data/building/building.ts";
import type { ItemRarity } from "../../data/inventory/inventoryItem.ts";

export type BuildingComponent = {
    id: typeof BuildingComponentId;
    building: Building;
    scaffolded: boolean;
    adjacency?: Adjacency;
    /** Quality of the building, determined by input materials when constructed */
    quality?: ItemRarity;
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
