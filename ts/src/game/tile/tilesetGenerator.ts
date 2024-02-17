import { createChestTileset } from "../../data/tileset2/chestTile.js";
import { createForrestTileset } from "../../data/tileset2/forrestTile.js";
import { Tileset } from "../../data/tileset2/tileset.js";
import {
    GroundChunk,
    TilesComponent,
} from "../component/tile/tilesComponent.js";
import { Entity } from "../entity/entity.js";

export class TilesetGenerator {
    getRandomTileset(rootEntity: Entity, chunk: GroundChunk): Tileset {
        const tilecomponent = rootEntity.requireComponent(TilesComponent);
        const numberOfChunks = Object.keys(tilecomponent.chunkMap).length;

        switch (numberOfChunks) {
            case 6:
                return createChestTileset(chunk);
            default:
                return createForrestTileset(chunk);
        }
    }
}
