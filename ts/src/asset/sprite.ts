import { Bounds } from "../common/bounds";
import { assets, ImageAsset } from "./assets";
import { coinsFlat, coinSprite } from "./sprites/coinSprite";
import { cursorSprite } from "./sprites/cursor";
import { farmerSprite } from "./sprites/farmerSprite";
import { foxSprite } from "./sprites/foxSprite";
import { keepSprite } from "./sprites/keepSprite";
import { swordsManSprite } from "./sprites/swordsmanSprite";
import { treeSprite } from "./sprites/treeSprite";
import { woodenHouseSprite } from "./sprites/woodHouseSprite";

export type Sprite = {
    bounds: Bounds;
    asset: ImageAsset;
};

export const sprites = {
    woodHouse: woodenHouseSprite,
    cursor: cursorSprite,
    tree: treeSprite,
    swordsman: swordsManSprite,
    farmer: farmerSprite,
    coins: coinSprite,
    coinsFlat: coinsFlat,
    fox: foxSprite,
    keep: keepSprite,
};
