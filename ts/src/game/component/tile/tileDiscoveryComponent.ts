import {
    adjacentPointsWithPattern,
    diamondPattern,
} from "../../../common/pattern.js";
import { Point, addPoint, adjacentPoints } from "../../../common/point.js";
import { createRandomTileSet } from "../../../data/tileset/randomTileSet.js";
import { ChunkSize, getChunkPosition } from "../../chunk.js";
import { Entity } from "../../entity/entity.js";
import { EntityComponent, StatelessComponent } from "../entityComponent.js";
import { ChunkMapComponent } from "../root/chunk/chunkMapComponent.js";
import { PathFindingComponent } from "../root/path/pathFindingComponent.js";
import { TilesComponent } from "./tilesComponent.js";

export class TileDiscoveryComponent extends StatelessComponent {
    override onUpdate(_tick: number): void {
        //get adjacent tiles
        const adjacentTiles = adjacentPointsWithPattern(
            this.entity.worldPosition,
            diamondPattern,
        );
        const rootEntity = this.entity.getRootEntity();
        const tileMapComponent = rootEntity.requireComponent(TilesComponent);
        const pathFindingComponent =
            rootEntity.requireComponent(PathFindingComponent);

        for (const tile of adjacentTiles) {
            this.discoverTile(
                tile,
                rootEntity,
                tileMapComponent,
                pathFindingComponent,
            );
        }
    }

    private discoverTile(
        point: Point,
        rootEntity: Entity,
        tileComponent: TilesComponent,
        pathFindingComponent: PathFindingComponent,
    ) {
        if (!tileComponent.getTile(point)) {
            this.unlockChunk(
                point,
                rootEntity,
                tileComponent,
                pathFindingComponent,
            );
            return true;
        } else {
            return false;
        }
    }

    private unlockChunk(
        point: Point,
        rootEntity: Entity,
        tileComponent: TilesComponent,
        pathFindingComponent: PathFindingComponent,
    ) {
        const chunk = getChunkPosition(point);
        const chunkStart = this.chunkStartPosition(chunk);
        const tileset = createRandomTileSet({
            chunkX: chunk.x,
            chunkY: chunk.y,
        });

        const tiles = tileset.factory.createTiles();
        for (const tile of tiles) {
            tileComponent.setTile({
                tileX: tile.tileX,
                tileY: tile.tileY,
            });
            pathFindingComponent.invalidateGraphPoint({
                x: tile.tileX,
                y: tile.tileY,
            });
        }

        const entities = tileset.factory.createEntities();
        for (const entity of entities) {
            rootEntity.addChild(entity);
        }

        tileComponent.setChunk({ chunkX: chunk.x, chunkY: chunk.y });
    }

    private chunkStartPosition(chunkPosition: Point): Point {
        return {
            x: chunkPosition.x * ChunkSize,
            y: chunkPosition.y * ChunkSize,
        };
    }
}
