import { tilesets } from "../../../../../generated/tilesets.js";
import { sprites2 } from "../../../../asset/sprite.js";
import { randomEntry, shuffleItems } from "../../../../common/array.js";
import {
    Bounds,
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
    zeroBounds,
} from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import {
    Point,
    addPoint,
    pointEquals,
    pointGrid,
} from "../../../../common/point.js";
import {
    buildings,
    getBuildingById,
} from "../../../../data/building/buildings.js";
import { BuildingComponent } from "../../../component/building/buildingComponent.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { HealthComponent } from "../../../component/health/healthComponent.js";
import { NpcAreaComponent } from "../../../component/npc/npcAreaComponent.js";
import { Entity } from "../../../entity/entity.js";
import { buildingPrefab } from "../../../prefab/buildingPrefab.js";
import { farmPrefab } from "../../../prefab/farmPrefab.js";
import { housePrefab } from "../../../prefab/housePrefab.js";
import { mobPrefab } from "../../../prefab/mobPrefab.js";
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
        const itemPosition = biome.worldPosition(item);
        const fortEntity = new Entity(generateId("fort"));

        rootEntity.addChild(fortEntity);
        const spawnPoints: Point[] = [];
        for (const entity of tileset.entities) {
            const position = addPoint(itemPosition, entity.position);
            switch (entity.id) {
                case "farm":
                    createFarmEntity(position, fortEntity);
                    break;
                case "tavern":
                    createTavernEntity(position, fortEntity);
                    break;
                case "well":
                    createWellEntity(position, fortEntity);
                    break;
                case "house":
                    createHouseEntity(position, fortEntity);
                    break;
                case "windmill":
                    createWindmillEntity(position, fortEntity);
                    break;
                case "barracks":
                    createBarracksEntity(position, fortEntity);
                    break;
                case "gravestone":
                    createGravestoneEntity(position, fortEntity);
                    break;
                case "wall":
                    createWallEntity(position, fortEntity);
                    break;
                case "spawn":
                    spawnPoints.push(position);
                    break;
                default:
                    break;
            }
        }
        const bounds: Bounds = {
            x1: itemPosition.x,
            y1: itemPosition.y,
            x2: itemPosition.x + item.size.x,
            y2: itemPosition.y + item.size.y,
        };
        const areaComponent = new NpcAreaComponent(bounds, spawnPoints);
        fortEntity.addComponent(areaComponent);

        if (spawnPoints.length > 0) {
            const mobPosition = randomEntry(spawnPoints);
            const mob = mobPrefab(generateId("mob"));
            mob.position = mobPosition;
            fortEntity.addChild(mob);
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
