import { randomEntry, shuffleItems } from "../../common/array.js";
import {
    Bounds,
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../common/bounds.js";
import { decodePosition, Point, subtractPoint } from "../../common/point.js";
import { QuadTree } from "../../common/structure/quadtree.js";
import { intersectRect } from "../../common/structure/rectangle.js";
import { SparseSet } from "../../common/structure/sparseSet.js";
import { BiomeMap, BiomeMapItemEntityFactory } from "./biome/biomeMap.js";
import { Tileset, TilesetVariant, getLargestSize } from "./tileset.js";

export function placeTileset(
    tileset: Tileset,
    map: BiomeMap,
    factory: (tileset: TilesetVariant) => BiomeMapItemEntityFactory,
): Bounds | null {
    let availableVariants = tileset.variants;
    const skipedPoints = new Set<number>();

    while (availableVariants.length > 0) {
        const variant = randomEntry(availableVariants);
        const size = {
            x: variant.width,
            y: variant.height,
        };

        let point: Point | null = null;

        for (let i = 0; i < map.availablePoints.dense.length; i++) {
            const availablePoint = map.availablePoints.dense[i];
            if (skipedPoints.has(availablePoint)) {
                continue;
            }

            const decodedPoint = decodePosition(availablePoint);
            if (decodedPoint.x + size.x > 31 || decodedPoint.y + size.y > 31) {
                continue;
            }
            const query = map.itemTree.query({
                x: decodedPoint.x,
                y: decodedPoint.y,
                width: size.x,
                height: size.y,
            });

            if (query.length == 0) {
                point = decodedPoint;
                break;
            }
        }

        if (point) {
            map.setItem({
                name: tileset.name,
                point: { x: point.x, y: point.y },
                size: size,
                factory: factory(variant),
            });

            return {
                x1: point.x,
                y1: point.y,
                x2: point.x + size.x,
                y2: point.y + size.y,
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
