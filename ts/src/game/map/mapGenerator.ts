import {
    randomEntry,
    shuffleItems,
    weightedRandomEntry,
} from "../../common/array.js";
import { Point, adjacentPoints, pointEquals } from "../../common/point.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TileComponent, tileId } from "../ecsComponent/world/tileComponent.js";
import { Entity } from "../entity/entity.js";
import { BiomeEntry, BiomeType, biomes } from "./biome/biome.js";
import { BiomeMap } from "./biome/biomeMap.js";
import { BiomeMapCollection } from "./biome/biomeMapCollection.js";
import { addPlayerToBiome } from "./biome/common/player.js";
import { createDesertBiome } from "./biome/desert/desertBiome.js";
import { createForrestBiome } from "./biome/forrest/forrestBiome.js";
import { createMountainsBiome } from "./biome/mountains/mountainBiome.js";
import { createPlainsBiome } from "./biome/plains/plainsBiome.js";
import { createSnowBiome } from "./biome/snow/snowBiome.js";
import { createSwampBiome } from "./biome/swamp/swampBiomes.js";
import { createTaintBiome } from "./biome/taint/taintBiome.js";
import { CHUNK_SIZE, NUMBER_OF_BIOMES } from "./constants.js";

export function generateMap(world: EcsWorldScope) {
    const biomes = generateBiomes();
    console.log("created biomes", biomes);
    const shuffledBiomes = shuffleItems(biomes);
    const biomeMaps = createBiomeMaps(shuffledBiomes);
    const tileComponent = new TileComponent();
    const rootEntity = world.createEntity();
    world.addComponent(rootEntity, tileComponent);

    for (const biomeMap of biomeMaps.maps) {
        createTilesForBiomes(biomeMap, tileComponent);
        createEntitiesForBiomes(biomeMap, world, biomeMaps);
    }
}

function createBiomeMaps(biomes: BiomeEntry[]): BiomeMapCollection {
    const biomeMaps = new BiomeMapCollection(biomes);
    // Pick the player biome
    addPlayerToBiome(biomeMaps, randomEntry(biomes));

    // Pick biomes to add non player kingdoms to
    for (const biome of biomes) {
        switch (biome.type) {
            case "desert":
                createDesertBiome(biome, biomeMaps);
                break;
            case "forrest":
                createForrestBiome(biome, biomeMaps);
                break;
            case "mountains":
                createMountainsBiome(biome, biomeMaps);
                break;
            case "plains":
                createPlainsBiome(biome, biomeMaps);
                break;
            case "snow":
                createSnowBiome(biome, biomeMaps);
                break;
            case "swamp":
                createSwampBiome(biome, biomeMaps);
                break;
            case "taint":
                createTaintBiome(biome, biomeMaps);
                break;
            default:
                console.warn("Unknown biome type", biome);
                break;
        }
    }
    //TODO: Do a second pass to connect things like roads, rivers and such in other biomes
    return biomeMaps;
}

function createEntitiesForBiomes(
    biome: BiomeMap,
    world: EcsWorldScope,
    biomeMaps: BiomeMapCollection,
) {
    for (const biomeItem of biome.items) {
        biomeItem.factory(biomeItem, biome, biomeMaps, world);
    }
}

function createTilesForBiomes(biomeMap: BiomeMap, tiles: TileComponent) {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            const tx = biomeMap.point.x * 32 + x;
            const ty = biomeMap.point.y * 32 + y;
            tiles.tiles[tileId(tx, ty)] = {
                x: tx,
                y: ty,
                type: biomeMap.type,
            };
        }
    }
}

function generateBiomes(): BiomeEntry[] {
    const biomeMap: BiomeEntry[] = [];
    let availableBiomes: Point[] = [];
    for (let x = 0; x < NUMBER_OF_BIOMES; x++) {
        for (let y = 0; y < NUMBER_OF_BIOMES; y++) {
            availableBiomes.push({ x, y });
        }
    }
    shuffleItems(availableBiomes);
    // Set one biome to be tainted
    const taintBiomePoint = availableBiomes.pop();
    if (!!taintBiomePoint) {
        biomeMap.push({
            type: "taint",
            point: taintBiomePoint,
        });
    }

    // Set at least one biome to be mountains
    const mountainBiomePoint = availableBiomes.pop();
    if (!!mountainBiomePoint) {
        biomeMap.push({
            type: "mountains",
            point: mountainBiomePoint,
        });

        //Find the first adjacent point in the list of shuffled available points
        const snowPoint = adjacentPoints(mountainBiomePoint).find(
            (adjacentPoint) => {
                //Check if the list of available biome points contains the adjacent point
                return availableBiomes.some((biomePoint) => {
                    return pointEquals(biomePoint, adjacentPoint);
                });
            },
        );

        if (!!snowPoint) {
            availableBiomes = availableBiomes.filter((item) => {
                return !pointEquals(item, snowPoint);
            });
            biomeMap.push({
                type: "snow",
                point: snowPoint,
            });
        }
    }

    const validBiomeTypesForGeneration = Object.values(
        Object.entries(biomes).filter((entries) => entries[1].generate),
    ).map((item) => item[0]) as BiomeType[];

    while (availableBiomes.length > 0) {
        const nextBiomePoint = availableBiomes.pop();
        if (!nextBiomePoint) {
            break;
        }

        const randomWeights = getWeights(
            availableBiomes,
            nextBiomePoint,
            validBiomeTypesForGeneration,
            biomeMap,
        );
        const nextBiomeType = weightedRandomEntry(
            validBiomeTypesForGeneration,
            Object.values(randomWeights),
        );

        biomeMap.push({
            type: nextBiomeType,
            point: nextBiomePoint,
        });
    }

    return biomeMap;
}

function getWeights(
    _availableBiomePoints: Point[],
    _thisBiomePoint: Point,
    availableBiomes: BiomeType[],
    currentlyGeneratedBiomes: BiomeEntry[],
): { [id: string]: number } {
    const biomeWeights: { [id: string]: number } = {};
    const totalBiomes = currentlyGeneratedBiomes.length;

    for (const availableBiomeType of availableBiomes) {
        let typeCount = currentlyGeneratedBiomes.filter(
            (biome) => biome.type == availableBiomeType,
        ).length;

        const typeWeight = biomes[availableBiomeType].modifier;
        const typeModifier = Math.max(typeCount, 1);

        biomeWeights[availableBiomeType] =
            typeWeight / Math.pow(typeModifier, 2);
    }

    return biomeWeights;
}
