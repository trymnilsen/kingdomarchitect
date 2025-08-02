import { treeResource } from "../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../component/chunkMapComponent.js";
import { EffectEmitterComponentId } from "../component/effectEmitter.js";
import { TileComponentId } from "../component/tileComponent.js";
import { Entity } from "../entity/entity.js";
import { resourcePrefab } from "../prefab/resourcePrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";
import { spawnTree } from "./item/vegetation.js";

export function addInitialPlayerChunk(rootEntity: Entity) {
    const chunkEntity = new Entity("chunk");
    rootEntity.addChild(chunkEntity);
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    const effectEmitter = rootEntity.requireEcsComponent(
        EffectEmitterComponentId,
    );

    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    const firstWorker = workerPrefab();
    const firstTree = resourcePrefab(treeResource);
    firstTree.position = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };
    firstWorker.position = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };
    chunkEntity.addChild(firstWorker);
    chunkEntity.addChild(firstTree);
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);

    const trees = spawnTree(16, { x: 0, y: 0 }, chunkMap);
    for (const tree of trees) {
        chunkEntity.addChild(tree);
    }
    //set discovery of tile for player
    //broadcast discovery
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
