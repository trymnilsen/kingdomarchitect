import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import { InventoryItem } from "../../data/inventory/inventoryItem.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../../data/inventory/items/equipment.js";
import { goldCoins } from "../../data/inventory/items/resources.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { Entity } from "../entity/entity.js";
import { chestPrefab } from "../prefab/chestPrefab.js";
import { farmPrefab } from "../prefab/farmPrefab.js";
import { housePrefab } from "../prefab/housePrefab.js";
import { trainingDummyPrefab } from "../prefab/trainingDummyPrefab.js";
import { treePrefab } from "../prefab/treePrefab.js";
import { wellPrefab } from "../prefab/wellPrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";
import { spawnTree } from "./util/vegetation.js";

export function addInitialPlayerChunk(rootEntity: Entity) {
    rootEntity.requireComponent(TilesComponent).setChunk({
        chunkX: 0,
        chunkY: 0,
        volume: {
            id: generateId("volume"),
            maxSize: Math.ceil(Math.random() * 4),
            type: "forrest",
            size: 1,
            chunks: [{ x: 0, y: 0 }],
            debugColor: randomColor(),
        },
        discovered: new Set(),
    });
    const firstWorker = workerPrefab(generateId("worker"));
    const firstHouse = housePrefab(generateId("house"), false);
    const firstFarm = farmPrefab(generateId("farm"));
    const firstTree = treePrefab(generateId("tree"), 1);
    const well = wellPrefab(generateId("well"));
    const chestItems: InventoryItem[] = [
        goldCoins,
        swordItem,
        hammerItem,
        wizardHat,
        bowItem,
    ];
    const chest = chestPrefab(generateId("chest"), chestItems);
    const trainingDummy = trainingDummyPrefab(generateId("dummy"));
    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    chest.position = { x: 2 + randomOffsetX, y: randomOffsetY };
    firstFarm.position = { x: 1 + randomOffsetX, y: 0 + randomOffsetY };
    firstHouse.position = { x: 0 + randomOffsetX, y: 0 + randomOffsetY };
    firstTree.position = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };
    firstWorker.position = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };
    well.position = { x: 1 + randomOffsetX, y: 1 + randomOffsetY };
    trainingDummy.position = { x: 1, y: 1 };
    rootEntity.addChild(firstFarm);
    rootEntity.addChild(firstWorker);
    rootEntity.addChild(firstHouse);
    rootEntity.addChild(firstTree);
    rootEntity.addChild(well);
    rootEntity.addChild(chest);
    spawnTree(16, { x: 0, y: 0 }, rootEntity);
}
