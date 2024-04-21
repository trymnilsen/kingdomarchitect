import { shuffleItems, weightedRandomEntry } from "../../common/array.js";
import { Point, adjacentPoints, pointEquals } from "../../common/point.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { Entity } from "../entity/entity.js";
import { BiomeEntry, BiomeType, biomes } from "./biome/biome.js";
import { BiomeMap } from "./biome/biomeMap.js";
import { createDesertBiome } from "./biome/desert/desertBiome.js";
import { createForrestBiome } from "./biome/forrest/forrestBiome.js";
import { createMountainsBiome } from "./biome/mountains/mountainBiome.js";
import { createPlainsBiome } from "./biome/plains/plainsBiome.js";
import { createSnowBiome } from "./biome/snow/snowBiome.js";
import { createSwampBiome } from "./biome/swamp/swampBiomes.js";
import { createTaintBiome } from "./biome/taint/taintBiome.js";
import { CHUNK_SIZE, NUMBER_OF_BIOMES } from "./constants.js";

export function generateMap(rootEntity: Entity) {
    const biomes = generateBiomes();
    console.log("created biomes", biomes);
    const biomeMaps = createBiomeMaps(biomes, rootEntity);
    for (const biomeMap of biomeMaps) {
        createTilesForBiomes(biomeMap, rootEntity);
        createEntitiesForBiomes(biomeMap, rootEntity, biomeMaps);
    }
}

function createBiomeMaps(
    biomes: BiomeEntry[],
    _rootEntity: Entity,
): BiomeMap[] {
    const biomeMaps: BiomeMap[] = [];
    for (const biome of biomes) {
        switch (biome.type) {
            case "desert":
                const desertBiome = createDesertBiome(biomes, biomeMaps, biome);
                biomeMaps.push(desertBiome);
                break;
            case "forrest":
                const forrestBiome = createForrestBiome(biome);
                biomeMaps.push(forrestBiome);
                break;
            case "mountains":
                const mountainBiome = createMountainsBiome(biome);
                biomeMaps.push(mountainBiome);
                break;
            case "plains":
                const plainsBiome = createPlainsBiome(biome);
                biomeMaps.push(plainsBiome);
                break;
            case "snow":
                const snowBiome = createSnowBiome(biome);
                biomeMaps.push(snowBiome);
                break;
            case "swamp":
                const swampBiome = createSwampBiome(biome);
                biomeMaps.push(swampBiome);
                break;
            case "taint":
                const taintBiome = createTaintBiome(biome);
                biomeMaps.push(taintBiome);
                break;
            default:
                const defaultMap = new BiomeMap(biome.point, biome.type);
                biomeMaps.push(defaultMap);
                break;
        }
    }
    //TODO: Do a second pass to connect things like roads, rivers and such
    return biomeMaps;
}

function createEntitiesForBiomes(
    biome: BiomeMap,
    rootEntity: Entity,
    biomeMaps: BiomeMap[],
) {
    for (const biomeItem of biome.items) {
        biomeItem.factory(biomeItem, biome, biomeMaps, rootEntity);
    }
}

function createTilesForBiomes(biomeMap: BiomeMap, rootEntity: Entity) {
    const component = rootEntity.requireComponent(TilesComponent);
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            component.setTile(
                {
                    tileX: biomeMap.point.x * 32 + x,
                    tileY: biomeMap.point.y * 32 + y,
                    type: biomeMap.type,
                },
                true,
            );
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

        /*
        console.log("Random biome picked:", nextBiomeType);
        console.log("With weights", randomWeights);
        console.log("before biomes", biomeMap);
        */

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
