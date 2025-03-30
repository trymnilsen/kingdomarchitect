import { findMapped, randomEntry, removeItem } from "../../../common/array.js";
import { generateId } from "../../../common/idGenerator.js";
import {
    addPoint,
    multiplyPoint,
    Point,
    pointGrid,
} from "../../../common/point.js";
import {
    SettlementComponent,
    SettlementType,
} from "../../componentOld/npc/settlementComponent.js";
import { TileChunk } from "../../componentOld/tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../componentOld/world/spatialChunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import { farmPrefab } from "../../prefab/farmPrefab.js";
import { housePrefab } from "../../prefab/housePrefab.js";
import { orcHousePrefab } from "../../prefab/orcHousePrefab.js";
import { ChunkSize } from "../chunk.js";

export function placeSettlement(chunk: TileChunk, chunkEntity: Entity) {
    if (chunk.volume.id === "volume1") {
        return;
    }
    //Decide if no settlement, orcs or humans
    const procValue = Math.random();
    if (procValue < 0.5) {
        console.log(`placeSettlement - Proc ${procValue} less than 0.5`);
        return;
    }
    console.log(`placeSettlement - Proc ${procValue} > 0.5, adding settlement`);

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

    if (existingSettlement) {
        console.log("Expand settlement", chunk.volume.id);
    } else {
        const xPosition = Math.floor(Math.random() * 6) + 1;
        const yPosition = Math.floor(Math.random() * 6) + 1;
        const point = addPoint(chunkEntity.worldPosition, {
            x: xPosition,
            y: yPosition,
        });

        if (procValue > 0.8) {
            console.log("Add orc settlement to", chunk.volume.id);
            placeOrcSettlement(chunkEntity, point);
        } else {
            console.log("Add human settlement to", chunk.volume.id);
            placeHumanSettlement(chunk, chunkEntity, point);
        }
    }
}

function placeOrcSettlement(chunkEntity: Entity, position: Point) {
    const settlementEntity = new Entity(generateId("settlement"));
    chunkEntity.addChild(settlementEntity);

    const orcHouseEntity = orcHousePrefab();
    const farmEntity = farmPrefab();

    const positions = pointGrid(2, 2);
    const orcPosition = randomEntry(positions);
    removeItem(positions, orcPosition);

    const farmPosition = randomEntry(positions);
    orcHouseEntity.worldPosition = addPoint(position, orcPosition);
    farmEntity.worldPosition = addPoint(position, farmPosition);
    chunkEntity.addChild(orcHouseEntity);
    chunkEntity.addChild(farmEntity);
    const settlementComponent = new SettlementComponent();
    settlementComponent.type = SettlementType.Orc;
    chunkEntity.addComponent(settlementComponent);
}

function placeHumanSettlement(
    _chunk: TileChunk,
    chunkEntity: Entity,
    position: Point,
) {
    chunkEntity.addComponent(new SettlementComponent());

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
}
