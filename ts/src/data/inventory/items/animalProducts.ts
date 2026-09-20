import { spriteRefs } from "../../../asset/sprite.ts";
import { ItemRarity } from "./../inventoryItem.ts";

/**
 * What comes off a carcass. These are the raw forms: the smokehouse, the
 * tannery and the fletcher all sit downstream of them, so hunting feeds trades
 * rather than dropping finished goods.
 */
export const rawMeatItem = {
    asset: spriteRefs.farm_4, // placeholder sprite
    id: "rawmeat",
    name: "Raw Meat",
    hint: "Smoked or roasted before anyone will eat it",
    rarity: ItemRarity.Common,
} as const;

export const hideItem = {
    asset: spriteRefs.farm_4, // placeholder sprite
    id: "hide",
    name: "Hide",
    hint: "Skin off a beast, tanned into leather",
    rarity: ItemRarity.Common,
} as const;

export const feathersItem = {
    asset: spriteRefs.farm_4, // placeholder sprite
    id: "feathers",
    name: "Feathers",
    hint: "Fletching for arrows, stuffing for a bed",
    rarity: ItemRarity.Common,
} as const;

export const animalProducts = [rawMeatItem, hideItem, feathersItem] as const;
