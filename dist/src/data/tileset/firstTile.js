function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { chestPrefab } from "../../game/world/prefab/chestPrefab.js";
import { bowItem, hammerItem, swordItem, wizardHat } from "../inventory/equipment.js";
import { goldCoins } from "../inventory/resources.js";
export function createFirstTileSet(chunk) {
    const tiles = [];
    for(let x = 0; x < 3; x++){
        for(let y = 0; y < 3; y++){
            tiles.push({
                x: chunk.chunkX * 3 + x,
                y: chunk.chunkY * 3 + y
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
        factory
    };
}
export class FirstTileFactory {
    createTiles() {
        return this.tiles.map((point)=>{
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: this.hasTree(point)
            };
        });
    }
    createEntities() {
        const entities = [];
        const chestItems = [
            goldCoins,
            swordItem,
            hammerItem,
            wizardHat,
            bowItem
        ];
        const chestEntity = chestPrefab(generateId("chest"), chestItems);
        chestEntity.worldPosition = {
            x: this.chunk.chunkX * 3 + 1,
            y: this.chunk.chunkY * 3 + 1
        };
        entities.push(chestEntity);
        return entities;
    }
    hasTree(point) {
        const x = point.x % 3;
        const y = point.y % 3;
        if (y == 0 && (x == 2 || x == 1)) {
            return Math.floor(Math.random() * 3) + 1;
        } else {
            return 0;
        }
    }
    constructor(chunk, tiles){
        _define_property(this, "chunk", void 0);
        _define_property(this, "tiles", void 0);
        this.chunk = chunk;
        this.tiles = tiles;
    }
}
