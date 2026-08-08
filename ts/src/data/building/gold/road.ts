import { spriteRefs } from "../../../asset/sprite.ts";

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
} as const;
