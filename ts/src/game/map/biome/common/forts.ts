import { tilesets } from "../../../../../generated/tilesets.js";
import { sprites2 } from "../../../../asset/sprite.js";
import { randomEntry, shuffleItems } from "../../../../common/array.js";
import {
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import {
    buildings,
    getBuildingById,
} from "../../../../data/building/buildings.js";
import { BuildingComponent } from "../../../component/building/buildingComponent.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { HealthComponent } from "../../../component/health/healthComponent.js";
import { Entity } from "../../../entity/entity.js";
import { buildingPrefab } from "../../../prefab/buildingPrefab.js";
import { farmPrefab } from "../../../prefab/farmPrefab.js";
import { housePrefab } from "../../../prefab/housePrefab.js";
import { wellPrefab } from "../../../prefab/wellPrefab.js";
import { TilesetVariant, getLargestSize } from "../../tileset.js";
import { placeTileset } from "../../tilesetPlacer.js";
import { BiomeEntry, BiomeType } from "../biome.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateForts(biomeMap: BiomeMap) {
    const shouldPlaceForts = Math.random() > getFortWeight(biomeMap.type);
    if (shouldPlaceForts) {
        placeTileset(tilesets.fort, biomeMap, createEntityFactory);
    }
}

function getFortWeight(type: BiomeType): number {
    switch (type) {
        case "forrest":
        case "snow":
        case "plains":
            return 0.1;
        default:
            return 0.4;
    }
}

function createEntityFactory(
    tileset: TilesetVariant,
): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        for (const entity of tileset.entities) {
            const position = addPoint(
                biome.worldPosition(item),
                entity.position,
            );
            switch (entity.id) {
                case "farm":
                    createFarmEntity(position, rootEntity);
                    break;
                case "tavern":
                    createTavernEntity(position, rootEntity);
                    break;
                case "well":
                    createWellEntity(position, rootEntity);
                    break;
                case "house":
                    createHouseEntity(position, rootEntity);
                    break;
                case "windmill":
                    createWindmillEntity(position, rootEntity);
                    break;
                case "barracks":
                    createBarracksEntity(position, rootEntity);
                    break;
                case "gravestone":
                    createGravestoneEntity(position, rootEntity);
                    break;
                case "wall":
                    createWallEntity(position, rootEntity);
                    break;
                default:
                    break;
            }
        }
    };
}

function createFarmEntity(position: Point, rootEntity: Entity) {
    const farm = farmPrefab(generateId("farm"));
    farm.worldPosition = position;
    rootEntity.addChild(farm);
}

function createTavernEntity(position: Point, rootEntity: Entity) {
    const tavernEntity = new Entity(generateId("tavern"));
    tavernEntity.addComponent(
        new SpriteComponent(
            sprites2.building_tavern,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    tavernEntity.worldPosition = position;
    rootEntity.addChild(tavernEntity);
}

function createWellEntity(position: Point, rootEntity: Entity) {
    const well = wellPrefab(generateId("well"));
    well.worldPosition = position;
    rootEntity.addChild(well);
}

function createHouseEntity(position: Point, rootEntity: Entity) {
    const house = housePrefab(generateId("house"), false);
    house.worldPosition = position;
    rootEntity.addChild(house);
}

function createWindmillEntity(position: Point, rootEntity: Entity) {
    const windmillEntity = new Entity(generateId("windmill"));
    windmillEntity.addComponent(
        new SpriteComponent(
            sprites2.building_mill,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    windmillEntity.worldPosition = position;
    rootEntity.addChild(windmillEntity);
}

function createBarracksEntity(position: Point, rootEntity: Entity) {
    const barracksEntity = new Entity(generateId("barracks"));
    barracksEntity.addComponent(
        new SpriteComponent(
            sprites2.goblin_house,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    barracksEntity.worldPosition = position;
    rootEntity.addChild(barracksEntity);
}

function createGravestoneEntity(position: Point, rootEntity: Entity) {
    const gravestoneEntity = new Entity(generateId("gravestone"));
    gravestoneEntity.addComponent(
        new SpriteComponent(
            sprites2.building_tombstone,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    gravestoneEntity.worldPosition = position;
    rootEntity.addChild(gravestoneEntity);
}

function createWallEntity(position: Point, rootEntity: Entity) {
    const wallEntity = buildingPrefab(
        generateId("building"),
        getBuildingById("stonewall")!,
        [],
        false,
    );
    wallEntity.requireComponent(HealthComponent).healToMax();
    //wallEntity.requireComponent(BuildingComponent).finishBuild();
    wallEntity.worldPosition = position;
    rootEntity.addChild(wallEntity);
}
