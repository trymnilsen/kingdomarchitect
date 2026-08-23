import { randomColor } from "../../common/color/hexColor.ts";
import { generateId } from "../../common/idGenerator.ts";
import type { Point } from "../../common/point.ts";
import { farm } from "../../data/building/grow/grow.ts";
import { cresset } from "../../data/building/light/cresset.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import { stockPile } from "../../data/building/wood/storage.ts";
import {
    stoneResource,
    treeResource,
} from "../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../component/chunkMapComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import { setChunk, TileComponentId } from "../component/tileComponent.ts";
import { Entity } from "../entity/entity.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { playerKingdomPrefab } from "../prefab/playerKingdomPrefab.ts";
import { resourcePrefab } from "../prefab/resourcePrefab.ts";
import { trainingDummyPrefab } from "../prefab/trainingDummyPrefab.ts";
import { workerPrefab } from "../prefab/workerPrefab.ts";
import { generateSpawnPoints } from "./item/vegetation.ts";

export function addInitialPlayerChunk(scopedEntity: Entity): Point {
    const chunkEntity = new Entity("chunk");
    scopedEntity.addChild(chunkEntity);
    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    const firstWorkerPosition = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };

    // Player kingdom entity groups all player buildings and workers,
    // establishing the boundary for job and stockpile scoping.
    const playerKingdom = playerKingdomPrefab();
    chunkEntity.addChild(playerKingdom);
    playerKingdom.position = { x: 0, y: 0 };

    const firstWorker = workerPrefab();
    const firstFarm = buildingPrefab(farm, false);
    const firstTree = resourcePrefab(treeResource);
    const trainingDummy = trainingDummyPrefab();
    const firstHouse = buildingPrefab(woodenHouse, false);
    firstHouse.requireEcsComponent(HousingComponentId).tenant = firstWorker.id;

    // The stockpile starts empty. A kingdom owns nothing it has not cut,
    // mined, or grown, so the opening move is always to send the first worker
    // at a tree.
    const startingStockpile = buildingPrefab(stockPile, false);

    // World resources stay on the chunk entity
    chunkEntity.addChild(firstTree);
    firstTree.worldPosition = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };

    // Player units and buildings go under the kingdom entity
    playerKingdom.addChild(firstWorker);
    firstWorker.worldPosition = firstWorkerPosition;

    playerKingdom.addChild(trainingDummy);
    trainingDummy.worldPosition = { x: randomOffsetX, y: randomOffsetY };

    playerKingdom.addChild(firstHouse);
    firstHouse.worldPosition = { x: 1 + randomOffsetX, y: randomOffsetY };

    playerKingdom.addChild(firstFarm);
    firstFarm.worldPosition = { x: 1 + randomOffsetX, y: 1 + randomOffsetY };

    playerKingdom.addChild(startingStockpile);
    startingStockpile.worldPosition = {
        x: 2 + randomOffsetX,
        y: randomOffsetY,
    };

    // A fresh kingdom starts with one deliberate light so it has a hearthlight
    // claim from day one. Plain buildings glow without claiming.
    const startingCresset = buildingPrefab(cresset, false);
    playerKingdom.addChild(startingCresset);
    startingCresset.worldPosition = {
        x: 2 + randomOffsetX,
        y: randomOffsetY + 1,
    };

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
}
