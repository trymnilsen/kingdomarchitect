import { sprites2 } from "../../../asset/sprite.ts";
import { ItemRarity } from "../inventoryItem.ts";

export const planksItem = {
    asset: sprites2.wood_resource,
    id: "planks",
    name: "Planks",
    hint: "Processed wooden planks",
    rarity: ItemRarity.Common,
} as const;

export const timberFramesItem = {
    asset: sprites2.wood_resource,
    id: "timberframes",
    name: "Timber Frames",
    hint: "Structural wooden frames",
    rarity: ItemRarity.Common,
} as const;

export const joineryItem = {
    asset: sprites2.wood_resource,
    id: "joinery",
    name: "Joinery",
    hint: "Fine woodwork components",
    rarity: ItemRarity.Common,
} as const;

export const ironBarsItem = {
    asset: sprites2.stone_resource,
    id: "ironbars",
    name: "Iron Bars",
    hint: "Smelted iron bars",
    rarity: ItemRarity.Common,
} as const;

export const stoneBarsItem = {
    asset: sprites2.stone_resource,
    id: "stonebars",
    name: "Stone Bars",
    hint: "Cut and dressed stone",
    rarity: ItemRarity.Common,
} as const;

export const gearsItem = {
    asset: sprites2.stone_resource,
    id: "gears",
    name: "Gears",
    hint: "Metal gears for machinery",
    rarity: ItemRarity.Common,
} as const;

export const clayBricksItem = {
    asset: sprites2.stone_resource,
    id: "claybricks",
    name: "Clay Bricks",
    hint: "Fired clay bricks",
    rarity: ItemRarity.Common,
} as const;

export const processedMaterials = [
    planksItem,
    timberFramesItem,
    joineryItem,
    ironBarsItem,
    stoneBarsItem,
    gearsItem,
    clayBricksItem,
] as const;
