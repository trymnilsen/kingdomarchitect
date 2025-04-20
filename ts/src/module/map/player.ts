import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import { treeResource } from "../../data/inventory/items/naturalResource.js";
import { makeSetTilesAction } from "../../game/action/world/setTilesAction.js";
import { makeUnlockChunkAction } from "../../game/action/world/unlockChunkAction.js";
import { ChunkMapComponent } from "../../game/component/chunkMapComponent.js";
import { TileComponent } from "../../game/component/tileComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { resourcePrefab } from "../../game/prefab/resourcePrefab.js";
import { workerPrefab } from "../../game/prefab/workerPrefab.js";
import { spawnTree } from "./item/vegetation.js";

export function addInitialPlayerChunk(rootEntity: Entity) {
    const chunkEntity = new Entity("chunk");
    rootEntity.addChild(chunkEntity);
    const tiles = Array.from(
        rootEntity.queryComponents(TileComponent).values(),
    )[0];

    rootEntity.dispatchAction(
        makeSetTilesAction({
            chunkX: 0,
            chunkY: 0,
            volume: {
                id: generateId("volume"),
                maxSize: Math.floor(Math.random() * 4) + 2,
                type: "forrest",
                size: 1,
                chunks: [{ x: 0, y: 0 }],
                debugColor: randomColor(),
            },
        }),
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
        .requireEcsComponent(ChunkMapComponent);

    const trees = spawnTree(16, { x: 0, y: 0 }, chunkMap);
    for (const tree of trees) {
        chunkEntity.addChild(tree);
    }
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
