/**
 * Resource IDs that NPCs can forage for food when no stockpile supply is available.
 * Each resource in this list must have at least one food-tagged yield item.
 */
export const FORAGEABLE_RESOURCE_IDS: readonly string[] = [
    "berrybush",
    "mushroom2",
    "cactusFlower",
    "plainsFlower",
    "swampFlower",
] as const;
