import type { Adjacency } from "../../common/adjacency.js";
import type { Building } from "../../data/building/building.js";
import type { Entity } from "../entity/entity.js";

export type HousingComponent = {
    id: typeof HousingComponentId;
    tenant: string | null;
};

export function createHousingComponent(
    tenant: Entity | null = null,
): HousingComponent {
    return {
        tenant: tenant?.id ?? null,
        id: HousingComponentId,
    };
}

export const HousingComponentId = "housing";
