import { Bounds } from "../common/bounds";
import { assets } from "./assets";
import { cursorSprite } from "./sprites/cursor";
import { treeSprite } from "./sprites/treeSprite";
import { woodenHouseSprite } from "./sprites/woodHouseSprite";

export type Sprite = {
    bounds: Bounds;
    asset: keyof typeof assets;
};

export const sprites = {
    woodHouse: woodenHouseSprite,
    cursor: cursorSprite,
    tree: treeSprite,
};
