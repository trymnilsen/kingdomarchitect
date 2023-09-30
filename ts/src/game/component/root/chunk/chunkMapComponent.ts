import { EventHandle } from "../../../../common/event.js";
import {
    Point,
    adjacentPoints,
    pointEquals,
} from "../../../../common/point.js";
import { getChunkId, getChunkPosition } from "../../../chunk.js";
import { visitChildren } from "../../../entity/child/visit.js";
import { Entity } from "../../../entity/entity.js";
import { EntityEvent } from "../../../entity/entityEvent.js";
import { StatelessComponent } from "../../entityComponent.js";
import { ChunkMapUpdateEvent } from "./chunkMapUpdateEvent.js";

type ChunkMap = { [chunkPosition: string]: { [entityId: string]: Entity } };

export class ChunkMapComponent extends StatelessComponent {
    /**
     * Holds a map of entities within a given chunk
     */
    private chunkMap: ChunkMap = {};
    /**
     * Holds a reverse mapping of entities and their chunk
     * The entities are keyed by their id and the chunks are defined by their
     * chunkId
     */
    private entityChunks: { [entityId: string]: string } = {};
    private entityEventHandle: EventHandle | null = null;

    getEntityAt(worldPosition: Point): Entity[] {
        const position = getChunkPosition(worldPosition);
        // We include any adjacent chunks to get any entitys that has bounds
        // stretching into the chunk of the position but has a world position
        // in an adjacent chunk
        const adjacentChunks = adjacentPoints(position, true);
        const chunkPositions = [position, ...adjacentChunks];
        const entities: Entity[] = [];
        for (const chunkPosition of chunkPositions) {
            const chunkId = getChunkId(chunkPosition);
            const chunkEntities = this.chunkMap[chunkId];
            if (chunkEntities) {
                for (const entity of Object.values(chunkEntities)) {
                    // Check if the entity has a bounds component
                    // If not then just check its position
                    if (pointEquals(entity.worldPosition, worldPosition)) {
                        entities.push(entity);
                    }
                }
            }
        }

        return entities;
    }

    override onStart(): void {
        this.rebuildChunkMap();
        this.entityEventHandle = this.entity.entityEvents.listen((event) => {
            this.onEntityEvent(event);
        });
    }

    override onStop(): void {
        if (this.entityEventHandle) {
            this.entityEventHandle();
        }
    }

    private onEntityEvent(event: EntityEvent): void {
        switch (event.id) {
            case "child_added":
                this.addEntityToChunkMap(event.target);
                break;
            case "child_removed":
                this.removeEntityFromChunkMap(event.target);
                break;
            case "transform":
                this.updateChunkMapForEntity(event.source);
                break;
        }
    }

    private removeEntityFromChunkMap(entity: Entity) {
        const entityChunkId = this.entityChunks[entity.id];
        const chunk = this.chunkMap[entityChunkId];
        if (chunk) {
            delete chunk[entity.id];
            delete this.entityChunks[entity.id];
        }

        this.invalidatePoint(entity.worldPosition);
    }

    private addEntityToChunkMap(entity: Entity) {
        const chunkPosition = getChunkPosition(entity.worldPosition);
        const chunkId = getChunkId(chunkPosition);
        const chunk = this.chunkMap[chunkId];
        if (!chunk) {
            this.chunkMap[chunkId] = {};
        }
        this.chunkMap[chunkId][entity.id] = entity;
        this.entityChunks[entity.id] = chunkId;

        this.invalidatePoint(entity.worldPosition);
    }

    private updateChunkMapForEntity(entity: Entity) {
        const oldChunkId = this.entityChunks[entity.id];
        const newChunkId = getChunkId(getChunkPosition(entity.worldPosition));
        if (oldChunkId != newChunkId) {
            // No need to remove entity from the chunk map if its not present
            if (oldChunkId) {
                this.removeEntityFromChunkMap(entity);
            }
            this.addEntityToChunkMap(entity);
        }

        const adjacent = adjacentPoints(entity.worldPosition);
        for (const point of adjacent) {
            this.invalidatePoint(point);
        }

        this.invalidatePoint(entity.worldPosition);
    }

    private invalidatePoint(point: Point) {
        this.publishEvent(new ChunkMapUpdateEvent(point, this));
    }

    private rebuildChunkMap() {
        this.chunkMap = {};
        this.entityChunks = {};
        visitChildren(this.entity, (entity) => {
            if (!entity.isGameRoot) {
                this.addEntityToChunkMap(entity);
            }

            return false;
        });
    }
}
