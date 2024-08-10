import { BuildingIds } from "../../../../data/building/buildings.js";
import { quary } from "../../../../data/building/stone/quary.js";
import { quaryApplicability } from "./applicability/quaryApplicability.js";
import { BuildingApplicability } from "./buildingApplicability.js";

export const buildingApplicabilityList: {
    [id: string]: BuildingApplicability;
} = {
    [quary.id]: quaryApplicability,
} as const;
