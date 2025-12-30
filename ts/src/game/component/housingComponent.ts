import type { Adjacency } from "../../common/adjacency.ts";
import type { Building } from "../../data/building/building.ts";
import type { Entity } from "../entity/entity.ts";

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
