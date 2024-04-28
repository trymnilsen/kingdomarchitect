import { randomEntry, shuffleItems } from "../../common/array.js";
import {
    Bounds,
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../common/bounds.js";
import { Point, subtractPoint } from "../../common/point.js";
import { BiomeMap, BiomeMapItemEntityFactory } from "./biome/biomeMap.js";
import { Tileset, TilesetVariant, getLargestSize } from "./tileset.js";

export function placeTileset(
    tileset: Tileset,
    map: BiomeMap,
    factory: (tileset: TilesetVariant) => BiomeMapItemEntityFactory,
): Bounds | null {
    let availableVariants = tileset.variants;
    while (availableVariants.length > 0) {
        const variant = randomEntry(availableVariants);
        const size = {
            x: variant.width,
            y: variant.height,
        };

        const positions = getAllPositionsBoundsFitWithinBounds(
            { x: 32, y: 32 },
            size,
            (candidate) => map.isSpotAvailable(candidate),
        );

        if (positions.length > 0) {
            const tilesetPosition = randomEntry(shuffleItems(positions));

            map.setItem({
                name: tileset.name,
                point: { x: tilesetPosition.x1, y: tilesetPosition.y1 },
                size: sizeOfBounds(tilesetPosition),
                factory: factory(variant),
            });

            return tilesetPosition;
        } else {
            //Filter out this variant, we can also filter out items that are
            //larger in both width and height
            availableVariants = availableVariants.filter((item) => {
                const isLarger =
                    item.width >= variant.width &&
                    item.height >= variant.height;

                return !isLarger;
            });
        }
    }

    // Got here? No variants available
    console.log(
        `No variant for ${tileset.name} found that fits available space for in ${map.type} at ${map.point}`,
    );

    return null;
}

export function placeRandomEntity(
    map: BiomeMap,
    name: string,
    amount: number,
    factory: BiomeMapItemEntityFactory,
): number {
    if (amount < 1) {
        return 0;
    }

    const points: Point[] = [];
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            const pointCandidate: Bounds = {
                x1: x,
                y1: y,
                x2: x + 1,
                y2: y + 1,
            };
            if (map.isSpotAvailable(pointCandidate)) {
                points.push({ x, y });
            }
        }
    }

    const shuffledPoints = shuffleItems(points);
    const amountClamped = Math.min(shuffledPoints.length - 1, amount);
    for (let i = 0; i < amountClamped; i++) {
        const point = shuffledPoints[i];
        map.setItem({
            name: name,
            point: { x: point.x, y: point.y },
            size: { x: 1, y: 1 },
            factory: factory,
        });
    }

    return amountClamped;
}
