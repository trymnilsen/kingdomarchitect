import { spriteRefs } from "../../../asset/sprite.ts";

export const road = {
    id: "road",
    icon: spriteRefs.times,
    name: "Road",
    scale: 1,
    previewScale: 4,
    previewOffset: 0,
    /**
     * Never loot and never a raid objective. Paving is infrastructure, not
     * wealth, so it must not raise the kingdom score that paces raids.
     */
    raidValue: 0,
} as const;
