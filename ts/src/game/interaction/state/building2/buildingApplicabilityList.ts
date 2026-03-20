import { quary } from "../../../../data/building/stone/quary.ts";
import { forrester } from "../../../../data/building/wood/forrester.ts";
import { quaryApplicability } from "./applicability/quaryApplicability.ts";
import { forresterApplicability } from "./applicability/forresterApplicability.ts";
import { BuildingApplicability } from "./buildingApplicability.ts";

export const buildingApplicabilityList: {
    [id: string]: BuildingApplicability;
} = {
    [quary.id]: quaryApplicability,
    [forrester.id]: forresterApplicability,
} as const;
