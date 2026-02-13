import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.ts";
import type { Job } from "./job.ts";

export interface CraftingJob extends Job {
    id: typeof CraftingJobId;
    /** The building entity where crafting happens */
    targetBuilding: string;
    /** The recipe being crafted */
    recipe: CraftingRecipe;
}

export function createCraftingJob(
    buildingId: string,
    recipe: CraftingRecipe,
): CraftingJob {
    return {
        id: CraftingJobId,
        targetBuilding: buildingId,
        recipe,
    };
}

export const CraftingJobId = "craftingJob";
