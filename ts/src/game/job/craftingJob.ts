import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.ts";
import type { Job } from "./job.ts";

export interface CraftingJob extends Job {
    id: typeof CraftingJobId;
    /** The building entity where crafting happens */
    targetBuilding: string;
    /** The recipe being crafted */
    recipe: CraftingRecipe;
    /** Progress counter (ticks spent crafting) */
    progress: number;
}

export function createCraftingJob(
    buildingId: string,
    recipe: CraftingRecipe,
): CraftingJob {
    return {
        id: CraftingJobId,
        state: "pending",
        targetBuilding: buildingId,
        recipe,
        progress: 0,
    };
}

export const CraftingJobId = "craftingJob";
