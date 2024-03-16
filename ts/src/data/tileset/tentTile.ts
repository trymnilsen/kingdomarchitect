import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import { GroundChunk } from "../../game/component/tile/tilesComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { chestPrefab } from "../../game/prefab/chestPrefab.js";
import { tentPrefab } from "../../game/prefab/tentPrefab.js";
import { workerPrefab } from "../../game/prefab/workerPrefab.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../inventory/equipment.js";
import { InventoryItem } from "../inventory/inventoryItem.js";
import { goldCoins } from "../inventory/resources.js";
import { Tileset } from "./tileset.js";

export function createTentTile(ground: GroundChunk): Tileset {
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
    const tentEntity = tentPrefab(generateId("tent"));
    tentEntity.worldPosition = {
        x: ground.chunkX * 3 + 1,
        y: ground.chunkY * 3 + 1,
    };

    const firstTentWorker = workerPrefab(generateId("worker"));
    const secondTentWorker = workerPrefab(generateId("worker"));
    firstTentWorker.worldPosition = {
        x: ground.chunkX * 3,
        y: ground.chunkY * 3 + 1,
    };
    secondTentWorker.worldPosition = {
        x: ground.chunkX * 3 + 1,
        y: ground.chunkY * 3,
    };

    entities.push(firstTentWorker);
    entities.push(secondTentWorker);
    entities.push(tentEntity);
    return {
        entities,
        tiles,
        bounds,
    };
}
