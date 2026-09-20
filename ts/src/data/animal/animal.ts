import type { SpriteRef } from "../../asset/sprite.ts";
import type { BiomeType } from "../../game/map/biome.ts";
import type { LootTable } from "../loot/lootTable.ts";

export type Animal = {
    id: string;
    name: string;
    sprite: SpriteRef;
    biomes: readonly BiomeType[];
    /** Hitpoints the spawned animal starts and maxes out at. */
    health: number;
    loot: LootTable;
};
