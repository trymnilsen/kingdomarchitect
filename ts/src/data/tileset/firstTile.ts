import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import { GroundChunk } from "../../game/component/tile/tilesComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { chestPrefab } from "../../game/prefab/chestPrefab.js";
import { GroundTile } from "../../game/tile/ground.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../inventory/equipment.js";
import { InventoryItem } from "../inventory/inventoryItem.js";
import { goldCoins } from "../inventory/resources.js";
import { Tileset, TileSetFactory } from "./tileset.js";

export function createFirstTileSet(chunk: GroundChunk): Tileset {
    const tiles: Point[] = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tiles.push({
                x: chunk.chunkX * 3 + x,
                y: chunk.chunkY * 3 + y,
            });
        }
    }

    const bounds = getBounds(tiles);
    //Add inclusive to bounds
    bounds.y2 += 1;
    bounds.x2 += 1;
    const factory = new FirstTileFactory(chunk, tiles);
    return {
        name: "firstTile",
        tiles,
        bounds,
        factory,
    };
}

export class FirstTileFactory implements TileSetFactory {
    constructor(
        private chunk: GroundChunk,
        private tiles: Point[],
    ) {}

    createTiles(): GroundTile[] {
        return this.tiles.map((point) => {
            return {
                tileX: point.x,
                tileY: point.y,
            };
        });
    }

    createEntities(): Entity[] {
        const entities: Entity[] = [];
        const chestItems: InventoryItem[] = [
            goldCoins,
            swordItem,
            hammerItem,
            wizardHat,
            bowItem,
        ];
        const chestEntity = chestPrefab(generateId("chest"), chestItems);
        chestEntity.worldPosition = {
            x: this.chunk.chunkX * 3 + 1,
            y: this.chunk.chunkY * 3 + 1,
        };

        entities.push(chestEntity);
        return entities;
    }

    private hasTree(point: Point): number {
        const x = point.x % 3;
        const y = point.y % 3;

        if (y == 0 && (x == 2 || x == 1)) {
            return Math.floor(Math.random() * 3) + 1;
        } else {
            return 0;
        }
    }
}
