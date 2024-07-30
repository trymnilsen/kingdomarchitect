import { randomEntry } from "../../../../common/array.js";
import {
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../../../../data/inventory/items/equipment.js";
import { InventoryItem } from "../../../../data/inventory/inventoryItem.js";
import { goldCoins } from "../../../../data/inventory/items/resources.js";
import { Entity } from "../../../entity/entity.js";
import { chestPrefab } from "../../../prefab/chestPrefab.js";
import { farmPrefab } from "../../../prefab/farmPrefab.js";
import { housePrefab } from "../../../prefab/housePrefab.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { wellPrefab } from "../../../prefab/wellPrefab.js";
import { workerPrefab } from "../../../prefab/workerPrefab.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function addPlayerToBiome(
    biomes: BiomeMapCollection,
    playerBiome: BiomeEntry,
) {
    const biomeMap = biomes.getBiomeMap(playerBiome);
    generatePlayerEntity(biomeMap);
}

function generatePlayerEntity(biomeMap: BiomeMap) {
    //Get available bounds
    //Place
    const playerSpace = {
        x: 5,
        y: 5,
    };
    const playerStartBounds = biomeMap.getAvailableSpots(playerSpace);
    const pickedBounds = randomEntry(playerStartBounds);
    console.log(
        "adding player at: ",
        pickedBounds,
        biomeMap.point,
        biomeMap.type,
    );
    const size = sizeOfBounds(pickedBounds);
    biomeMap.setItem({
        point: {
            x: pickedBounds.x1,
            y: pickedBounds.y1,
        },
        size: size,
        name: "player",
        factory: (
            item: BiomeMapItem,
            biome: BiomeMap,
            _allBiomes: BiomeMapCollection,
            rootEntity: Entity,
        ) => {
            const worldPoint = biome.worldPosition(item);
            addPlayerEntities(rootEntity, worldPoint);
        },
    });
}

function addPlayerEntities(rootEntity: Entity, worldPosition: Point) {
    const firstWorker = workerPrefab(generateId("player-worker"));
    const firstHouse = housePrefab(generateId("house"), false);
    const firstFarm = farmPrefab(generateId("farm"));
    const well = wellPrefab(generateId("well"));
    const chestItems: InventoryItem[] = [
        goldCoins,
        swordItem,
        hammerItem,
        wizardHat,
        bowItem,
    ];
    const chestEntity = chestPrefab(generateId("chest"), chestItems);
    chestEntity.position = addPoint(worldPosition, { x: 3, y: 2 });
    firstFarm.position = addPoint(worldPosition, { x: 2, y: 1 });
    firstHouse.position = addPoint(worldPosition, { x: 1, y: 1 });
    firstWorker.position = addPoint(worldPosition, { x: 1, y: 2 });
    well.position = addPoint(worldPosition, { x: 2, y: 2 });
    rootEntity.addChild(firstFarm);
    rootEntity.addChild(firstWorker);
    rootEntity.addChild(firstHouse);
    rootEntity.addChild(well);
    rootEntity.addChild(chestEntity);
}
