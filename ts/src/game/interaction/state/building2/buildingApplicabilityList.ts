import { quary } from "../../../../data/building/stone/quary.ts";
import { quaryApplicability } from "./applicability/quaryApplicability.ts";
import { BuildingApplicability } from "./buildingApplicability.ts";

export const buildingApplicabilityList: {
    [id: string]: BuildingApplicability;
} = {
    [quary.id]: quaryApplicability,
} as const;
