import { randomColor } from "../../common/color.ts";
import { generateId } from "../../common/idGenerator.ts";
import type { Point } from "../../common/point.ts";
import { farm } from "../../data/building/grow/grow.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import {
    stoneResource,
    treeResource,
} from "../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../component/chunkMapComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import { setChunk, TileComponentId } from "../component/tileComponent.ts";
import { Entity } from "../entity/entity.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { resourcePrefab } from "../prefab/resourcePrefab.ts";
import { trainingDummyPrefab } from "../prefab/trainingDummyPrefab.ts";
import { workerPrefab } from "../prefab/workerPrefab.ts";
import { generateSpawnPoints } from "./item/vegetation.ts";

export function addInitialPlayerChunk(scopedEntity: Entity): Point {
    const chunkEntity = new Entity("chunk");
    scopedEntity.addChild(chunkEntity);
    const tiles = scopedEntity.requireEcsComponent(TileComponentId);
    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    const firstWorker = workerPrefab();
    const firstFarm = buildingPrefab(farm, false);
    const firstTree = resourcePrefab(treeResource);
    const firstWorkerPosition = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };
    const trainingDummy = trainingDummyPrefab();
    const firstHouse = buildingPrefab(woodenHouse, false);
    firstHouse.requireEcsComponent(HousingComponentId).tenant = firstWorker.id;
    trainingDummy.position = { x: randomOffsetX, y: randomOffsetY };
    firstTree.position = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };
    firstHouse.position = { x: 1 + randomOffsetX, y: randomOffsetY };
    firstFarm.position = { x: 1 + randomOffsetX, y: 1 + randomOffsetY };
    firstWorker.position = firstWorkerPosition;
    chunkEntity.addChild(firstWorker);
    chunkEntity.addChild(firstTree);
    chunkEntity.addChild(trainingDummy);
    chunkEntity.addChild(firstHouse);
    chunkEntity.addChild(firstFarm);

    scopedEntity.updateComponent(TileComponentId, (component) => {
        setChunk(component, {
            chunkX: 0,
            chunkY: 0,
            volume: {
                isStartBiome: true,
                id: generateId("volume"),
                maxSize: 2,
                type: "forrest",
                chunks: [{ x: 0, y: 0 }],
                debugColor: randomColor(),
            },
        });
    });
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    const trees = generateSpawnPoints(16, { x: 0, y: 0 }, chunkMap);
    for (const tree of trees) {
        const treeEntity = resourcePrefab(treeResource);
        treeEntity.worldPosition = tree;
        chunkEntity.addChild(treeEntity);
    }

    const firstStone = generateSpawnPoints(1, { x: 0, y: 0 }, chunkMap);
    const firstStoneEntity = resourcePrefab(stoneResource);
    firstStoneEntity.worldPosition = firstStone[0];
    chunkEntity.addChild(firstStoneEntity);
    return firstWorkerPosition;
    /*
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
    firstHouse.requireComponent(HousingComponent).residentId = firstWorker.id;
    trainingDummy.position = { x: 1, y: 1 };
    chunkEntity.addChild(firstFarm);
    chunkEntity.addChild(firstWorker);
    chunkEntity.addChild(firstHouse);
    chunkEntity.addChild(firstTree);
    chunkEntity.addChild(well);
    chunkEntity.addChild(chest);
    
    */
}
