import { Bounds } from "../common/bounds";
import { ImageAsset } from "./assets";
import { coinsFlat, coinSprite } from "./sprites/coinSprite";
import { cursorSprite } from "./sprites/cursor";
import { farmerSprite } from "./sprites/farmerSprite";
import { foxSprite } from "./sprites/foxSprite";
import { keepSprite } from "./sprites/keepSprite";
import { stoneWoodWalls } from "./sprites/stoneWoodWalls";
import { swordsManSprite } from "./sprites/swordsmanSprite";
import { treeSprite, treeSprite2, treeSprite3 } from "./sprites/treeSprite";
import {
    woodenHouseScaffold,
    woodenHouseSprite,
} from "./sprites/woodHouseSprite";

export type Sprite = {
    bounds: Bounds;
    asset: ImageAsset;
};

export const sprites = {
    woodHouse: woodenHouseSprite,
    woodHouseScaffold: woodenHouseScaffold,
    cursor: cursorSprite,
    tree: treeSprite,
    tree2: treeSprite2,
    tree3: treeSprite3,
    swordsman: swordsManSprite,
    farmer: farmerSprite,
    coins: coinSprite,
    coinsFlat: coinsFlat,
    fox: foxSprite,
    keep: keepSprite,
    stoneWoodWalls: stoneWoodWalls,
};

export function spriteWithSize(
    asset: ImageAsset,
    width: number,
    height: number
): Sprite {
    return {
        asset: asset,
        bounds: {
            x1: 0,
            y1: 0,
            x2: width,
            y2: height,
        },
    };
}
