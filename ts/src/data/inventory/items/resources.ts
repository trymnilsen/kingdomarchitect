import { spriteRefs } from "../../../asset/sprite.ts";
import { ItemRarity, ItemTag } from "./../inventoryItem.ts";

export const woodResourceItem = {
    asset: spriteRefs.wood_resource,
    id: "wood",
    name: "Block of wood",
    rarity: ItemRarity.Common,
} as const;

export const wheatResourceItem = {
    asset: spriteRefs.farm_4,
    id: "wheat",
    name: "Wheat",
    rarity: ItemRarity.Common,
} as const;

export const stoneResource = {
    asset: spriteRefs.stone_resource,
    id: "stone",
    name: "Stone",
    rarity: ItemRarity.Common,
} as const;

export const bagOfGlitter = {
    asset: spriteRefs.bag_of_glitter,
    id: "bagofglitter",
    name: "Bag O'Glitter",
} as const;

export const gemResource = {
    asset: spriteRefs.gem_resource,
    id: "gem",
    name: "Ruby gem",
} as const;

export const goldCoins = {
    asset: spriteRefs.gold_coins,
    id: "goldcoins",
    name: "Gold coins",
} as const;

export const healthPotion = {
    asset: spriteRefs.health_potion,
    id: "healthpotion",
    name: "Health Potion",
    tag: [ItemTag.Consumable],
} as const;

export const manaPotion = {
    asset: spriteRefs.mana_potion,
    id: "manapotion",
    name: "Mana Potion",
} as const;

export const blueBook = {
    asset: spriteRefs.blue_book,
    id: "tomeofsecrets",
    name: "Tome of Secrets",
    hint: "Just pictures of ducks",
} as const;

export const scroll = {
    asset: spriteRefs.scroll,
    id: "scroll",
    name: "Magic Scroll",
} as const;

export const resources = [
    scroll,
    blueBook,
    manaPotion,
    healthPotion,
    goldCoins,
    gemResource,
    bagOfGlitter,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
] as const;
