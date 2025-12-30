import { sprites2 } from "../../../asset/sprite.ts";
import { ItemTag } from "./../inventoryItem.ts";

export const woodResourceItem = {
    asset: sprites2.wood_resource,
    id: "wood",
    name: "Block of wood",
} as const;

export const wheatResourceItem = {
    asset: sprites2.farm_4,
    id: "wheat",
    name: "Wheat",
} as const;

export const stoneResource = {
    asset: sprites2.stone_resource,
    id: "stone",
    name: "Stone",
} as const;

export const bagOfGlitter = {
    asset: sprites2.bag_of_glitter,
    id: "bagofglitter",
    name: "Bag O'Glitter",
} as const;

export const gemResource = {
    asset: sprites2.gem_resource,
    id: "gem",
    name: "Ruby gem",
} as const;

export const goldCoins = {
    asset: sprites2.gold_coins,
    id: "goldcoins",
    name: "Gold coins",
} as const;

export const healthPotion = {
    asset: sprites2.health_potion,
    id: "healthpotion",
    name: "Health Potion",
    tag: [ItemTag.Consumable],
} as const;

export const manaPotion = {
    asset: sprites2.mana_potion,
    id: "manapotion",
    name: "Mana Potion",
} as const;

export const blueBook = {
    asset: sprites2.blue_book,
    id: "tomeofsecrets",
    name: "Tome of Secrets",
    hint: "Just pictures of ducks",
} as const;

export const scroll = {
    asset: sprites2.scroll,
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
