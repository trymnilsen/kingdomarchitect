import { InvalidStateError } from "../../../common/error/invalidStateError";
import { adjacentPoints, Point, pointEquals } from "../../../common/point";
import { getChunkId, getChunkPosition } from "../chunk";
import { PathFindingComponent } from "../component/root/path/pathFindingComponent";
import { Entity } from "./entity";
import { EntityEvent } from "./entityEvent";

type ChunkMap = { [chunkPosition: string]: { [entityId: string]: Entity } };

/**
 * The root entity is used as the parent of all entities in the world
 * It cannot be moved or get components added to it. This class is not exported
 * as it is only needed once in the world
 */
export class RootEntity extends Entity {
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

    constructor(id: string) {
        super(id);
        this._isRoot = true;
    }

    public getEntityAt(worldPosition: Point): Entity[] {
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
            if (!!chunkEntities) {
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

    public override bubbleEvent(event: EntityEvent): void {
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

    /**
     * Overrides for the root
     */
    public override get parent(): Entity | undefined {
        return undefined;
    }
    public override set parent(entity: Entity | undefined) {
        throw new InvalidStateError("Cannot set parent of root entity");
    }

    private removeEntityFromChunkMap(entity: Entity) {
        const entityChunkId = this.entityChunks[entity.id];
        const chunk = this.chunkMap[entityChunkId];
        if (!!chunk) {
            delete chunk[entity.id];
            delete this.entityChunks[entity.id];
        }

        // TODO: this should be handled in the component as an event?
        const pathFindingComponent = this.getComponent(PathFindingComponent);
        if (!!pathFindingComponent) {
            pathFindingComponent.invalidateGraphPoint(entity.worldPosition);
        }
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

        // TODO: this should be handled in the component as an event?
        const pathFindingComponent = this.getComponent(PathFindingComponent);
        if (!!pathFindingComponent) {
            pathFindingComponent.invalidateGraphPoint(entity.worldPosition);
        }
    }

    private updateChunkMapForEntity(entity: Entity) {
        const oldChunkId = this.entityChunks[entity.id];
        const newChunkId = getChunkId(getChunkPosition(entity.worldPosition));
        if (oldChunkId != newChunkId) {
            // No need to remove entity from the chunk map if its not present
            if (!!oldChunkId) {
                this.removeEntityFromChunkMap(entity);
            }
            this.addEntityToChunkMap(entity);
        }

        // TODO: this should be handled in the component as an event?
        const pathFindingComponent = this.getComponent(PathFindingComponent);
        if (!!pathFindingComponent) {
            const adjacent = adjacentPoints(entity.worldPosition);
            for (const point of adjacent) {
                pathFindingComponent.invalidateGraphPoint(point);
            }
            pathFindingComponent.invalidateGraphPoint(entity.worldPosition);
        }
    }
}
