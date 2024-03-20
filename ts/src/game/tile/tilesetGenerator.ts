import { barbarianTile } from "../../data/tileset/barbarianTile.js";
import { createChestTileset } from "../../data/tileset/chestTile.js";
import { createForrestTileset } from "../../data/tileset/forrestTile.js";
import { createTentTile } from "../../data/tileset/tentTile.js";
import { Tileset } from "../../data/tileset/tileset.js";
import {
    GroundChunk,
    TilesComponent,
} from "../component/tile/tilesComponent.js";
import { Entity } from "../entity/entity.js";
import { barbarianCampPrefab } from "../prefab/barbarianCampPrefab.js";

export class TilesetGenerator {
    getRandomTileset(rootEntity: Entity, chunk: GroundChunk): Tileset {
        const tilecomponent = rootEntity.requireComponent(TilesComponent);
        const numberOfChunks = Object.keys(tilecomponent.chunkMap).length;

        switch (numberOfChunks) {
            case 12:
                return barbarianTile(chunk);
            case 7:
                return createTentTile(chunk);
            case 6:
                return createChestTileset(chunk);
            default:
                return createForrestTileset(chunk);
        }
    }
}
