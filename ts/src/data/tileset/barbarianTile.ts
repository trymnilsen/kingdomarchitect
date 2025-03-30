import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import { GroundChunk } from "../../game/componentOld/tile/tilesComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { orcHousePrefab } from "../../game/prefab/orcHousePrefab.js";
import { chestPrefab } from "../../game/prefab/chestPrefab.js";
import { mobPrefab } from "../../game/prefab/mobPrefab.js";
import { tentPrefab } from "../../game/prefab/tentPrefab.js";
import { workerPrefab } from "../../game/prefab/workerPrefab.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../inventory/items/equipment.js";
import { InventoryItem } from "../inventory/inventoryItem.js";
import { goldCoins } from "../inventory/items/resources.js";
import { Tileset } from "./tileset.js";

export function barbarianTile(ground: GroundChunk): Tileset {
    const tiles: Point[] = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tiles.push({
                x: ground.chunkX * 3 + x,
                y: ground.chunkY * 3 + y,
            });
        }
    }

    const bounds = getBounds(tiles);
    //Add inclusive to bounds
    bounds.y2 += 1;
    bounds.x2 += 1;

    const entities: Entity[] = [];
    const campEntity = orcHousePrefab(generateId("camp"));
    campEntity.worldPosition = {
        x: ground.chunkX * 3 + 1,
        y: ground.chunkY * 3 + 1,
    };

    const firstMob = mobPrefab(generateId("mob"));
    const secondMob = mobPrefab(generateId("mob"));
    firstMob.worldPosition = {
        x: ground.chunkX * 3,
        y: ground.chunkY * 3 + 1,
    };
    secondMob.worldPosition = {
        x: ground.chunkX * 3 + 1,
        y: ground.chunkY * 3,
    };

    entities.push(firstMob);
    entities.push(secondMob);
    entities.push(campEntity);
    return {
        entities,
        tiles,
        bounds,
    };
}
