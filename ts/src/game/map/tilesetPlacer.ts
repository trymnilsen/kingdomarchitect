import { randomEntry, shuffleItems } from "../../common/array.js";
import { Bounds, sizeOfBounds } from "../../common/bounds.js";
import { decodePosition, Point, subtractPoint } from "../../common/point.js";
import { QuadTree } from "../../common/structure/quadtree.js";
import { Rectangle, splitRectangle } from "../../common/structure/rectangle.js";
import { BiomeMap, BiomeMapItemEntityFactory } from "./biome/biomeMap.js";
import { Tileset, TilesetVariant, getLargestSize } from "./tileset.js";

// export function placeTileset2(
//     tileset: Tileset,
//     map: BiomeMap,
//     factory: (tileset: TilesetVariant) => BiomeMapItemEntityFactory,
// ): Bounds | null {
//     let availableVariants = tileset.variants;
//     while (availableVariants.length > 0) {
//         const variant = randomEntry(availableVariants);
//         const size = {
//             x: variant.width,
//             y: variant.height,
//         };
//         console.log("tileset", tileset.name);
//         console.count("placeTileset");

//         const position = placeWithTilesplit(map.freeSpace, size.x, size.y);
//         if (!!position) {
//             map.setItem({
//                 name: tileset.name,
//                 point: { x: position.x, y: position.y },
//                 size: size,
//                 factory: factory(variant),
//             });

//             return {
//                 x1: position.x,
//                 y1: position.y,
//                 x2: position.x + size.x,
//                 y2: position.y + size.y,
//             };
//         } else {
//             //Filter out this variant, we can also filter out items that are
//             //larger in both width and height
//             availableVariants = availableVariants.filter((item) => {
//                 const isLarger =
//                     item.width >= variant.width &&
//                     item.height >= variant.height;

//                 return !isLarger;
//             });
//         }
//         /*
//         const position = getRandomPosition(map, size.x, size.y);

//         if (!!position) {
//             map.setItem({
//                 name: tileset.name,
//                 point: { x: position.x, y: position.y },
//                 size: size,
//                 factory: factory(variant),
//             });

//             return {
//                 x1: position.x,
//                 y1: position.y,
//                 x2: position.x + size.x,
//                 y2: position.y + size.y,
//             };
//         } else {
//             //Filter out this variant, we can also filter out items that are
//             //larger in both width and height
//             availableVariants = availableVariants.filter((item) => {
//                 const isLarger =
//                     item.width >= variant.width &&
//                     item.height >= variant.height;

//                 return !isLarger;
//             });
//         }*/
//     }

//     // Got here? No variants available
//     console.log(
//         `No variant for ${tileset.name} found that fits available space for in ${map.type} at`,
//         map.point,
//     );

//     return null;
// }

// export function placeRandomEntity2(
//     map: BiomeMap,
//     name: string,
//     amount: number,
//     factory: BiomeMapItemEntityFactory,
// ): void {
//     if (amount < 1) {
//         return;
//     }
//     for (let i = 0; i < amount; i++) {
//         const position = placeWithTilesplit(map.freeSpace, 1, 1);
//         if (!!position) {
//             const point = map.setItem({
//                 name: name,
//                 point: { x: position.x, y: position.y },
//                 size: { x: 1, y: 1 },
//                 factory: factory,
//             });
//         } else {
//             break;
//         }
//     }
// }
