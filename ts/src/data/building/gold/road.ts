import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";

export const road = {
    id: "road",
    icon: spriteRefs.empty_sprite,
    name: "Road",
    scale: 4,
    previewScale: 4,
    previewOffset: 0,
    /**
     * Never loot and never a raid objective. Paving is infrastructure, not
     * wealth, so it must not raise the kingdom score that paces raids.
     */
    raidValue: 0,
    /**
     * The cheapest ground in the game, which is the entire point of paving.
     * Pathfinding pays 1 to cross a road against 25 for bare ground, so routes
     * bend onto roads wherever one exists.
     */
    traversalWeight: 1,
} as const satisfies Building;
