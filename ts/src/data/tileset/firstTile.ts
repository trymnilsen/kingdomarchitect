import { sprites2 } from "../../asset/sprite";
import { getBounds } from "../../common/bounds";
import { generateId } from "../../common/idGenerator";
import { Point } from "../../common/point";
import { GroundChunk } from "../../game/world/component/tile/tilesComponent";
import { Entity } from "../../game/world/entity/entity";
import { chestPrefab } from "../../game/world/prefab/chestPrefab";
import { GroundTile } from "../../game/world/tile/ground";
import { InventoryItem } from "../inventory/inventoryItem";
import { Tileset, TileSetFactory } from "./tileset";

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
    constructor(private chunk: GroundChunk, private tiles: Point[]) {}

    createTiles(): GroundTile[] {
        return this.tiles.map((point) => {
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: this.hasTree(point),
            };
        });
    }

    createEntities(): Entity[] {
        const entities: Entity[] = [];
        const chestItems: InventoryItem[] = [
            {
                id: "gold",
                asset: sprites2.gold_coins,
                name: "Gold",
            },
            {
                id: "sword",
                asset: sprites2.sword_skill,
                name: "Sword",
            },
            {
                id: "axe",
                asset: sprites2.worker_skill,
                name: "Axe",
            },
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
