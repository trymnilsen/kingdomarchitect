import { fishingHut } from "../../../../../data/building/food/fishingHut.ts";
import { quary } from "../../../../../data/building/stone/quary.ts";
import { forrester } from "../../../../../data/building/wood/forrester.ts";
import { fishingHutApplicability } from "./applicability/fishingHutApplicability.ts";
import { onLand } from "./applicability/landApplicability.ts";
import { quaryApplicability } from "./applicability/quaryApplicability.ts";
import { forresterApplicability } from "./applicability/forresterApplicability.ts";
import { type BuildingApplicability } from "./buildingApplicability.ts";

export const buildingApplicabilityList: {
    [id: string]: BuildingApplicability;
} = {
    [quary.id]: onLand(quaryApplicability),
    [forrester.id]: onLand(forresterApplicability),
    [fishingHut.id]: fishingHutApplicability,
} as const;
