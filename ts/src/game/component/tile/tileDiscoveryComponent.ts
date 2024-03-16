import {
    adjacentPointsWithPattern,
    largeDiamondPattern,
} from "../../../common/pattern.js";
import { Point, addPoint, adjacentPoints } from "../../../common/point.js";
import { ChunkSize, getChunkPosition } from "../../chunk.js";
import { Entity } from "../../entity/entity.js";
import { TilesetGenerator } from "../../tile/tilesetGenerator.js";
import { EntityComponent } from "../entityComponent.js";
import { ChunkMapComponent } from "../root/chunk/chunkMapComponent.js";
import { PathFindingComponent } from "../root/path/pathFindingComponent.js";
import { TilesComponent } from "./tilesComponent.js";

export class TileDiscoveryComponent extends EntityComponent {
    private generator = new TilesetGenerator();

    unlockTiles(_position: Point, pattern: ReadonlyArray<Point>) {
        const tileMapComponent = this.entity.requireComponent(TilesComponent);
        const pathFindingComponent =
            this.entity.requireComponent(PathFindingComponent);

        for (const tile of pattern) {
            this.discoverTile(
                tile,
                this.entity,
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
        }

        tileComponent.setTile(
            {
                tileX: point.x,
                tileY: point.y,
            },
            true,
        );
    }

    private unlockChunk(
        point: Point,
        rootEntity: Entity,
        tileComponent: TilesComponent,
        pathFindingComponent: PathFindingComponent,
    ) {
        const chunk = getChunkPosition(point);
        const chunkStart = this.chunkStartPosition(chunk);
        const tileset = this.generator.getRandomTileset(rootEntity, {
            chunkX: chunk.x,
            chunkY: chunk.y,
        });

        for (const tile of tileset.tiles) {
            tileComponent.setTile({
                tileX: tile.x,
                tileY: tile.y,
            });
            pathFindingComponent.invalidateGraphPoint({
                x: tile.x,
                y: tile.y,
            });
        }

        tileComponent.setChunk({ chunkX: chunk.x, chunkY: chunk.y });

        for (const entity of tileset.entities) {
            rootEntity.addChild(entity);
        }
    }

    private chunkStartPosition(chunkPosition: Point): Point {
        return {
            x: chunkPosition.x * ChunkSize,
            y: chunkPosition.y * ChunkSize,
        };
    }
}
