import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point, pointGrid } from "../../common/point.js";
import { GroundChunk } from "../../game/componentOld/tile/tilesComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { treePrefab } from "../../game/prefab/treePrefab.js";
import { Tileset } from "./tileset.js";

export function createForrestTileset(ground: GroundChunk): Tileset {
    const tiles: Point[] = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tiles.push({
                x: ground.chunkX * 3 + x,
                y: ground.chunkY * 3 + y,
            });
        }
    }

    const bounds = getBounds(tiles);
    //Add inclusive to bounds
    bounds.y2 += 1;
    bounds.x2 += 1;

    const entities: Entity[] = [];
    const points = pointGrid(3, 3);
    const numberOfTrees = Math.floor(Math.random() * 9);
    for (let i = 0; i < numberOfTrees; i++) {
        const index = Math.floor(Math.random() * points.length);
        const treePosition = points[index];
        points.splice(index, 1);

        const treeX = treePosition.x;
        const treeY = treePosition.y;
        const treeEntity = treePrefab(
            generateId("tree"),
            Math.floor(Math.random() * 3),
        );
        treeEntity.worldPosition = {
            x: ground.chunkX * 3 + treeX,
            y: ground.chunkY * 3 + treeY,
        };

        entities.push(treeEntity);
    }

    return {
        entities,
        tiles,
        bounds,
    };
}
