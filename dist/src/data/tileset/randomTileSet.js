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
export function createRandomTileSet(chunk) {
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
    const factory = new RandomTileSetFactory(chunk, tiles);
    return {
        name: "randomTile",
        tiles,
        bounds,
        factory
    };
}
export class RandomTileSetFactory {
    createTiles() {
        return this.tiles.map((point)=>{
            const plantTree = Math.random() > 0.7;
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: plantTree ? Math.floor(Math.random() * 4) : 0
            };
        });
    }
    createEntities() {
        return [];
    }
    constructor(chunk, tiles){
        _define_property(this, "chunk", void 0);
        _define_property(this, "tiles", void 0);
        this.chunk = chunk;
        this.tiles = tiles;
    }
}
