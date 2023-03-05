import { sprites2 } from "../../asset/sprite";
import { InventoryItem } from "./inventoryItem";

export const woodResourceItem: InventoryItem = {
    asset: sprites2.wood_resource,
    id: "wood",
    name: "Block of wood",
};

export const stoneResource: InventoryItem = {
    asset: sprites2.stone_resource,
    id: "stone",
    name: "Stone",
};

export const bagOfGlitter: InventoryItem = {
    asset: sprites2.bag_of_glitter,
    id: "bagofglitter",
    name: "Bag O'Glitter",
};

export const gemResource: InventoryItem = {
    asset: sprites2.gem_resource,
    id: "gem",
    name: "Ruby gem",
};

export const goldCoins: InventoryItem = {
    asset: sprites2.gold_coins,
    id: "goldcoins",
    name: "Gold coins",
};

export const healthPotion: InventoryItem = {
    asset: sprites2.health_potion,
    id: "healthpotion",
    name: "Health Potion",
};

export const manaPotion: InventoryItem = {
    asset: sprites2.mana_potion,
    id: "manapotion",
    name: "Mana Potion",
};

export const blueBook: InventoryItem = {
    asset: sprites2.blue_book,
    id: "tomeofsecrets",
    name: "Tome of Secrets",
    hint: "Just pictures of ducks",
};

export const scroll: InventoryItem = {
    asset: sprites2.scroll,
    id: "scroll",
    name: "Magic Scroll",
};
