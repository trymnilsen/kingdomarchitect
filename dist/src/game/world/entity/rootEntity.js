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
import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { adjacentPoints, pointEquals } from "../../../common/point.js";
import { getChunkId, getChunkPosition } from "../chunk.js";
import { PathFindingComponent } from "../component/root/path/pathFindingComponent.js";
import { Entity } from "./entity.js";
/**
 * The root entity is used as the parent of all entities in the world
 * It cannot be moved or get components added to it. This class is not exported
 * as it is only needed once in the world
 */ export class RootEntity extends Entity {
    getEntityAt(worldPosition) {
        const position = getChunkPosition(worldPosition);
        // We include any adjacent chunks to get any entitys that has bounds
        // stretching into the chunk of the position but has a world position
        // in an adjacent chunk
        const adjacentChunks = adjacentPoints(position, true);
        const chunkPositions = [
            position,
            ...adjacentChunks
        ];
        const entities = [];
        for (const chunkPosition of chunkPositions){
            const chunkId = getChunkId(chunkPosition);
            const chunkEntities = this.chunkMap[chunkId];
            if (!!chunkEntities) {
                for (const entity of Object.values(chunkEntities)){
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
    bubbleEvent(event) {
        switch(event.id){
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
     */ get parent() {
        return undefined;
    }
    set parent(entity) {
        throw new InvalidStateError("Cannot set parent of root entity");
    }
    removeEntityFromChunkMap(entity) {
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
    addEntityToChunkMap(entity) {
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
    updateChunkMapForEntity(entity) {
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
            for (const point of adjacent){
                pathFindingComponent.invalidateGraphPoint(point);
            }
            pathFindingComponent.invalidateGraphPoint(entity.worldPosition);
        }
    }
    constructor(id){
        super(id);
        /**
     * Holds a map of entities within a given chunk
     */ _define_property(this, "chunkMap", {});
        /**
     * Holds a reverse mapping of entities and their chunk
     * The entities are keyed by their id and the chunks are defined by their
     * chunkId
     */ _define_property(this, "entityChunks", {});
        this._isRoot = true;
    }
}
