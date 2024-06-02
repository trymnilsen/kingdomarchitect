import { Direction } from "../../../common/direction.js";
import { Point, pointEquals, shiftPoint } from "../../../common/point.js";
import { BiomeEntry } from "./biome.js";
import { BiomeMap } from "./biomeMap.js";

export class BiomeMapCollection {
    private _maps: BiomeMap[] = [];
    public get maps(): ReadonlyArray<BiomeMap> {
        return this._maps;
    }
    constructor(private biomeEntries: BiomeEntry[]) {}
    hasAdjacentBiome(point: Point, direction: Direction): boolean {
        const adjacentPoint = shiftPoint(point, direction, 1);
        const hasAdjacentBiome = this.biomeEntries.some((biome) =>
            pointEquals(biome.point, adjacentPoint),
        );

        return hasAdjacentBiome;
    }

    getBiomeMap(playerBiome: BiomeEntry): BiomeMap {
        const existingMap = this._maps.find(
            (map) =>
                map.type == playerBiome.type &&
                pointEquals(map.point, playerBiome.point),
        );

        if (!!existingMap) {
            return existingMap;
        } else {
            const newMap = new BiomeMap(playerBiome.point, playerBiome.type);
            this._maps.push(newMap);
            return newMap;
        }
    }

    getAdjacentBiome(point: Point, direction: Direction): BiomeMap | undefined {
        const adjacentPoint = shiftPoint(point, direction, 1);
        const adjacentBiome = this._maps.find((biome) =>
            pointEquals(biome.point, adjacentPoint),
        );

        return adjacentBiome;
    }
}
