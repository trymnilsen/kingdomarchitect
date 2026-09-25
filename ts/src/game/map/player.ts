import { shuffleItems } from "../../common/array.ts";
import { randomColor } from "../../common/color/hexColor.ts";
import { generateId } from "../../common/idGenerator.ts";
import type { Point } from "../../common/point.ts";
import { farm } from "../../data/building/grow/grow.ts";
import { cresset } from "../../data/building/light/cresset.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import { stockPile } from "../../data/building/wood/storage.ts";
import { bowItem } from "../../data/inventory/items/equipment.ts";
import {
    stoneResource,
    treeResource,
} from "../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../component/chunkMapComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../component/inventoryComponent.ts";
import { setChunk, TileComponentId } from "../component/tileComponent.ts";
import { Entity } from "../entity/entity.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { playerKingdomPrefab } from "../prefab/playerKingdomPrefab.ts";
import { resourcePrefab } from "../prefab/resourcePrefab.ts";
import { trainingDummyPrefab } from "../prefab/trainingDummyPrefab.ts";
import { workerPrefab } from "../prefab/workerPrefab.ts";
import { TREES_PER_CHUNK, type PondGeneration } from "./biome.ts";
import { chunkFittingPondShapes, placePonds } from "./biome/placePonds.ts";
import { fixed, placeResource } from "./biome/placeResource.ts";
import {
    ChunkSize,
    createLandTerrain,
    getChunkBounds,
    paintTerrain,
    type TileChunk,
} from "./chunk.ts";
import { generateSpawnPoints } from "./item/vegetation.ts";
import { Terrain } from "./terrain.ts";
import { createEmptyMask, masksOverlap, type TileMask } from "./tileMask.ts";

const startLake: PondGeneration = {
    terrain: Terrain.Water,
    chance: 1,
    maxCount: 1,
    maxSize: 6,
};

const settlementSize = 3;
const lakeClearance = 2;
const preferredOffset = ChunkSize / 2 - 3;
const preferredSpread = 3;

export function addInitialPlayerChunk(
    scopedEntity: Entity,
    random: () => number = Math.random,
): Point {
    const chunkEntity = new Entity("chunk");
    scopedEntity.addChild(chunkEntity);

    const lake = placePonds(
        createEmptyMask(ChunkSize, ChunkSize),
        startLake,
        chunkFittingPondShapes,
        random,
    );
    const settlement = pickSettlementOffset(lake, random);
    const firstWorkerPosition = { x: settlement.x, y: settlement.y + 1 };

    const playerKingdom = playerKingdomPrefab();
    chunkEntity.addChild(playerKingdom);
    playerKingdom.position = { x: 0, y: 0 };

    const firstWorker = workerPrefab();
    const firstFarm = buildingPrefab(farm, false);
    const firstTree = resourcePrefab(treeResource);
    const trainingDummy = trainingDummyPrefab();
    const firstHouse = buildingPrefab(woodenHouse, false);
    firstHouse.requireEcsComponent(HousingComponentId).tenant = firstWorker.id;

    const startingStockpile = buildingPrefab(stockPile, false);
    addInventoryItem(
        startingStockpile.requireEcsComponent(InventoryComponentId),
        bowItem,
        1,
    );

    // World resources stay on the chunk entity
    chunkEntity.addChild(firstTree);
    firstTree.worldPosition = { x: settlement.x + 2, y: settlement.y + 2 };

    // Player units and buildings go under the kingdom entity
    playerKingdom.addChild(firstWorker);
    firstWorker.worldPosition = firstWorkerPosition;

    playerKingdom.addChild(trainingDummy);
    trainingDummy.worldPosition = { x: settlement.x, y: settlement.y };

    playerKingdom.addChild(firstHouse);
    firstHouse.worldPosition = { x: settlement.x + 1, y: settlement.y };

    playerKingdom.addChild(firstFarm);
    firstFarm.worldPosition = { x: settlement.x + 1, y: settlement.y + 1 };

    playerKingdom.addChild(startingStockpile);
    startingStockpile.worldPosition = {
        x: settlement.x + 2,
        y: settlement.y,
    };

    const startingCresset = buildingPrefab(cresset, false);
    playerKingdom.addChild(startingCresset);
    startingCresset.worldPosition = {
        x: settlement.x + 2,
        y: settlement.y + 1,
    };

    const startChunk: TileChunk = {
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
        terrain: paintTerrain(createLandTerrain(), lake, startLake.terrain),
    };
    scopedEntity.updateComponent(TileComponentId, (component) => {
        setChunk(component, startChunk);
    });
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeResource(
        fixed(TREES_PER_CHUNK),
        treeResource,
        startChunk,
        chunkEntity,
        chunkMap,
    );

    const firstStone = generateSpawnPoints(
        1,
        startChunk,
        getChunkBounds({ x: 0, y: 0 }),
        chunkMap,
    );
    const firstStoneEntity = resourcePrefab(stoneResource);
    firstStoneEntity.worldPosition = firstStone[0];
    chunkEntity.addChild(firstStoneEntity);
    return firstWorkerPosition;
}

export function pickSettlementOffset(
    lake: TileMask,
    random: () => number,
): Point {
    const candidates: Point[] = [];
    for (let y = 0; y <= ChunkSize - settlementSize; y++) {
        for (let x = 0; x <= ChunkSize - settlementSize; x++) {
            candidates.push({ x, y });
        }
    }

    // shuffle first so ties come out random
    shuffleItems(candidates, random).sort(
        (a, b) => distanceFromPreferred(a) - distanceFromPreferred(b),
    );

    const clearanceSize = settlementSize + 2 * lakeClearance;
    const clearance: TileMask = {
        width: clearanceSize,
        height: clearanceSize,
        rows: new Array<number>(clearanceSize).fill((1 << clearanceSize) - 1),
    };
    for (const candidate of candidates) {
        const touchesLake = masksOverlap(
            lake,
            clearance,
            candidate.x - lakeClearance,
            candidate.y - lakeClearance,
        );
        if (!touchesLake) {
            return candidate;
        }
    }
    throw new Error("No room in the start chunk for a settlement by the lake");
}

function distanceFromPreferred(offset: Point): number {
    return distanceOutsideWindow(offset.x) + distanceOutsideWindow(offset.y);
}

function distanceOutsideWindow(value: number): number {
    return Math.max(
        0,
        preferredOffset - value,
        value - (preferredOffset + preferredSpread),
    );
}
