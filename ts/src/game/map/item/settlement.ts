import { findMapped, randomEntry, removeItem } from "../../../common/array.js";
import { generateId } from "../../../common/idGenerator.js";
import {
    addPoint,
    multiplyPoint,
    Point,
    pointGrid,
} from "../../../common/point.js";
import { SettlementComponent } from "../../component/npc/settlementComponent.js";
import { TileChunk } from "../../component/tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../component/world/spatialChunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import { farmPrefab } from "../../prefab/farmPrefab.js";
import { housePrefab } from "../../prefab/housePrefab.js";
import { orcHousePrefab } from "../../prefab/orcHousePrefab.js";
import { ChunkSize } from "../chunk.js";

export function placeSettlement(chunk: TileChunk, rootEntity: Entity) {
    //Decide if no settlement, orcs or humans
    const randomValue = Math.random();
    if (randomValue < 0.5) {
        //return;
    }

    const xPosition = Math.floor(Math.random() * 6) + 1;
    const yPosition = Math.floor(Math.random() * 6) + 1;
    const point = addPoint(rootEntity.worldPosition, {
        x: xPosition,
        y: yPosition,
    });
    placeHumanSettlement(chunk, rootEntity, point);
    /*
    if (randomValue > 0.8) {
        placeOrcSettlement(rootEntity, point);
    } else {
        placeHumanSettlement(chunk, rootEntity, point);
    }*/
}

function placeOrcSettlement(rootEntity: Entity, position: Point) {
    const settlementEntity = new Entity(generateId("settlement"));
    rootEntity.addChild(settlementEntity);

    const orcHouseEntity = orcHousePrefab();
    const farmEntity = farmPrefab();

    const positions = pointGrid(2, 2);
    const orcPosition = randomEntry(positions);
    removeItem(positions, orcPosition);

    const farmPosition = randomEntry(positions);
    orcHouseEntity.worldPosition = addPoint(position, orcPosition);
    farmEntity.worldPosition = addPoint(position, farmPosition);
    settlementEntity.addChild(orcHouseEntity);
    settlementEntity.addChild(farmEntity);
}

function placeHumanSettlement(
    chunk: TileChunk,
    chunkEntity: Entity,
    position: Point,
) {
    //Check if there already is a settlement in the volume this chunk is
    //connected to
    const chunkMapComponent = chunkEntity.getAncestorComponent(
        SpatialChunkMapComponent,
    );

    if (!chunkMapComponent) {
        throw new Error("No chunk map component");
    }

    const existingSettlement = findMapped(chunk.volume.chunks, (chunkPoint) => {
        const settlementInChunkEntity = findMapped(
            chunkMapComponent.getEntitiesInChunk(chunkPoint),
            (entity) => entity.getComponent(SettlementComponent),
        );

        return settlementInChunkEntity;
    });

    if (!existingSettlement) {
        const settlementEntity = new Entity(generateId("settlement"));
        settlementEntity.addComponent(new SettlementComponent());
        chunkEntity.addChild(settlementEntity);

        const houseEntity = housePrefab();
        const farmEntity = farmPrefab();

        const positions = pointGrid(2, 2);
        const housePosition = randomEntry(positions);
        removeItem(positions, housePosition);

        const farmPosition = randomEntry(positions);
        houseEntity.worldPosition = addPoint(position, housePosition);
        farmEntity.worldPosition = addPoint(position, farmPosition);
        chunkEntity.addChild(houseEntity);
        chunkEntity.addChild(farmEntity);
        console.log("Add settlement to", chunk.volume.id);
    } else {
        console.log("Expand settlement!", chunk.volume.id);
    }
}
