import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import type { Point } from "../../common/point.js";
import {
    stoneResource,
    treeResource,
} from "../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../component/chunkMapComponent.js";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.js";
import { setChunk, TileComponentId } from "../component/tileComponent.js";
import { Entity } from "../entity/entity.js";
import { resourcePrefab } from "../prefab/resourcePrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";
import { generateSpawnPoints } from "./item/vegetation.js";

export function addInitialPlayerChunk(rootEntity: Entity): Point {
    const chunkEntity = new Entity("chunk");
    rootEntity.addChild(chunkEntity);
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    const firstWorker = workerPrefab();
    const firstTree = resourcePrefab(treeResource);
    const firstWorkerPosition = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };
    firstTree.position = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };
    firstWorker.position = firstWorkerPosition;
    chunkEntity.addChild(firstWorker);
    chunkEntity.addChild(firstTree);
    rootEntity.updateComponent(TileComponentId, (component) => {
        setChunk(component, {
            chunkX: 0,
            chunkY: 0,
            volume: {
                id: generateId("volume"),
                maxSize: Math.floor(Math.random() * 4) + 2,
                type: "forrest",
                chunks: [{ x: 0, y: 0 }],
                debugColor: randomColor(),
            },
        });
    });
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);

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
