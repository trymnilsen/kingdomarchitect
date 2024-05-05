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

    getAdjacentBiome(point: Point, direction: Direction): BiomeMap | undefined {
        const adjacentPoint = shiftPoint(point, direction, 1);
        const adjacentBiome = this._maps.find((biome) =>
            pointEquals(biome.point, adjacentPoint),
        );

        return adjacentBiome;
    }

    addBiomeMap(map: BiomeMap) {
        this._maps.push(map);
    }
}
