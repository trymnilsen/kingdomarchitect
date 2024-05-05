import {
    Axis,
    Direction,
    getAxis,
    invertDirection,
} from "../../../../common/direction.js";
import { Point, shiftPoint } from "../../../../common/point.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateConnectionPoints(
    biomeMap: BiomeMap,
    biomes: BiomeMapCollection,
) {
    generateRandomConnectionPoints(biomeMap, biomes, Direction.Left);
    generateRandomConnectionPoints(biomeMap, biomes, Direction.Right);
    generateRandomConnectionPoints(biomeMap, biomes, Direction.Up);
    generateRandomConnectionPoints(biomeMap, biomes, Direction.Down);
}

function generateRandomConnectionPoints(
    biomeMap: BiomeMap,
    biomes: BiomeMapCollection,
    direction: Direction,
) {
    let connectionPoints: number[] = [];
    if (biomes.hasAdjacentBiome(biomeMap.point, direction)) {
        const generatedBiome = biomes.getAdjacentBiome(
            biomeMap.point,
            direction,
        );

        const oppositeDirection = invertDirection(direction);
        const otherConnectionPoints =
            generatedBiome?.getConectionPointsForEdge(oppositeDirection) ?? [];
        //If there is a generated biome get the connection points of it
        if (otherConnectionPoints.length > 0) {
            connectionPoints = [...otherConnectionPoints];
        } else {
            // No biome has been generated for this side yet so we will create some points
            let amount = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < amount; i++) {
                connectionPoints.push(2 + Math.floor(Math.random() * 28));
            }
        }
    }

    for (const point of connectionPoints) {
        biomeMap.addConnectionPoint(point, direction);
    }
}
