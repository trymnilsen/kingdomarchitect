import { randomEntry, shuffleItems } from "../../common/array.js";
import {
    Bounds,
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../common/bounds.js";
import { decodePosition, Point, subtractPoint } from "../../common/point.js";
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
        console.log("tileset", tileset.name);
        console.count("placeTileset");
        console.countReset("isSpotAvailable");
        const positions = map.availablePoints.dense.filter((position) => {
            const { x, y } = decodePosition(position);
            if (x + size.x > 32 || y + size.y > 32) {
                return false;
            }

            return map.isSpotAvailable({
                x1: x,
                y1: y,
                x2: x + size.x,
                y2: y + size.y,
            });
        });

        if (positions.length > 0) {
            const tilesetPosition = randomEntry(positions);
            const { x, y } = decodePosition(tilesetPosition);
            map.setItem({
                name: tileset.name,
                point: { x: x, y: y },
                size: size,
                factory: factory(variant),
            });

            return {
                x1: x,
                y1: y,
                x2: x + size.x,
                y2: y + size.y,
            };
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
        `No variant for ${tileset.name} found that fits available space for in ${map.type} at`,
        map.point,
    );

    return null;
}

export function placeRandomEntity(
    map: BiomeMap,
    name: string,
    amount: number,
    factory: BiomeMapItemEntityFactory,
): void {
    if (amount < 1) {
        return;
    }

    while (amount > 0 && map.availablePoints.size > 0) {
        const randomPoint = randomEntry(map.availablePoints.dense);
        const decodedPoint = decodePosition(randomPoint);
        const point = map.setItem({
            name: name,
            point: { x: decodedPoint.x, y: decodedPoint.y },
            size: { x: 1, y: 1 },
            factory: factory,
        });
        amount--;
    }
}
