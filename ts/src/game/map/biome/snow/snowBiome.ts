import { sprites2 } from "../../../../asset/sprite.js";
import { generateId } from "../../../../common/idGenerator.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateRandomBuildings } from "../common/buildings.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateSmallMountains } from "../common/mountain.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generateRandomStones } from "../common/stone.js";
import { generateFrozenPonds } from "./frozenPonds.js";
import { generateSnowForrest } from "./snowForrest.js";

export function createSnowBiome(biome: BiomeEntry, biomes: BiomeMapCollection) {
    const biomeMap = biomes.getBiomeMap(biome);
    generateSmallMountains();
    generateFrozenPonds();
    generateSnowForrest();
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateRandomBuildings();
    generateMines();
    generateRandomStones(biomeMap, 32, 16);
    generateConnectionPoints(biomeMap, biomes);
    generatePineTrees(biomeMap);
    return biomeMap;
}

function generatePineTrees(
    map: BiomeMap,
    minAmount: number = 64,
    randomMultiplier: number = 200,
) {
    const randomAmount =
        minAmount + Math.floor(Math.random() * randomMultiplier);
    placeRandomEntity(map, "tree", randomAmount, treeFactory);
}

export function generateRandomBushes() {}

function treeFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const tumbleweedEntity = new Entity(generateId("pinetree"));
    tumbleweedEntity.addComponent(
        new SpriteComponent(
            sprites2.pine_tree,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    tumbleweedEntity.addComponent(new WeightComponent(10));
    tumbleweedEntity.worldPosition = position;
    rootEntity.addChild(tumbleweedEntity);
}
