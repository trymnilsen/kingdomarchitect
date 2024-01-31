import {
    adjacentPointsWithPattern,
    diamondPattern,
} from "../../../common/pattern.js";
import { Point, addPoint, adjacentPoints } from "../../../common/point.js";
import { ChunkSize, getChunkPosition } from "../../chunk.js";
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
            this.discoverTile(tile, tileMapComponent, pathFindingComponent);
        }
    }

    private discoverTile(
        point: Point,
        tileComponent: TilesComponent,
        pathFindingComponent: PathFindingComponent,
    ) {
        if (!tileComponent.getTile(point)) {
            this.unlockChunk(point, tileComponent, pathFindingComponent);
            return true;
        } else {
            return false;
        }
    }

    private unlockChunk(
        point: Point,
        tileComponent: TilesComponent,
        pathFindingComponent: PathFindingComponent,
    ) {
        const chunk = getChunkPosition(point);
        const chunkStart = this.chunkStartPosition(chunk);
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                const tilePosition = addPoint(chunkStart, { x, y });
                tileComponent.setTile({
                    tileX: tilePosition.x,
                    tileY: tilePosition.y,
                });
                pathFindingComponent.invalidateGraphPoint(tilePosition);
            }
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
