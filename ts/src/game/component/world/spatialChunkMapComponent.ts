import { Bounds } from "../../../common/bounds.js";
import { encodePosition, Point, pointEquals } from "../../../common/point.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
import { Entity } from "../../entity/entity.js";
import { EntityEvent } from "../../entity/entityEvent.js";
import { EntityComponent, EventListener } from "../entityComponent.js";

export class SpatialChunkMapComponent extends EntityComponent {
    chunks: Map<number, SparseSet<Entity>> = new Map();
    entityChunkMap: Map<string, number> = new Map();

    override onStart(_tick: number): void {
        this.entity.entityEvents.listen((event) => {
            this.onEntityEvent(event);
        });
    }

    private onEntityEvent(event: EntityEvent): void {
        switch (event.id) {
            case "child_added":
                this.addEntity(event.target);
                break;
            case "child_removed":
                this.removeEntity(event.target);
                break;
            case "transform":
                this.updateEntity(event.source);
                break;
        }
    }
    /**
     * Adds an entity to the chunk map using its world position
     * to determine which chunk it should be in
     * @param entity the entity to add
     */
    addEntity(entity: Entity): void {
        // Convert to chunk coordinates
        const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
        const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
        const chunkKey = encodePosition(chunkX, chunkY);
        const chunk = this.getOrCreateChunk(chunkKey);
        this.entityChunkMap.set(entity.id, chunkKey);
        chunk.add(entity);
    }

    /**
     * Removes an entity from the chunk map
     * @param entity the entity to remove
     */
    removeEntity(entity: Entity): void {
        const chunkForEntity = this.entityChunkMap.get(entity.id);
        if (!chunkForEntity) {
            return;
        }

        const chunk = this.chunks.get(chunkForEntity);
        if (!chunk) {
            return;
        }

        chunk.delete(entity);
        this.entityChunkMap.delete(entity.id);
    }

    updateEntity(entity: Entity): void {
        const currentChunkId = this.entityChunkMap.get(entity.id);
        if (!currentChunkId) {
            this.addEntity(entity);
            return;
        }

        const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
        const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
        const newChunkKey = encodePosition(chunkX, chunkY);
        if (currentChunkId == newChunkKey) {
            return;
        }
        const currentChunk = this.getOrCreateChunk(currentChunkId);
        currentChunk.delete(entity);

        this.entityChunkMap.set(entity.id, newChunkKey);
        const newChunk = this.getOrCreateChunk(newChunkKey);
        newChunk.add(entity);
    }

    /**
     * Gets all entities in the chunk at the given world position
     * @param x the x coordinate
     * @param y the y coordinate
     * @returns an array of entities within the chunk at the given position
     */
    getEntitiesAt(x: number, y: number): Entity[] {
        // Convert to chunk coordinates
        const chunkX = Math.floor(x / ChunkSize);
        const chunkY = Math.floor(y / ChunkSize);
        const chunkKey = encodePosition(chunkX, chunkY);

        const chunk = this.chunks.get(chunkKey);
        if (!chunk) {
            return [];
        }

        const entities: Entity[] = [];
        for (let i = 0; i < chunk.size; i++) {
            const entity = chunk.elementAt(i);
            const atPosition =
                entity.worldPosition.x === x && entity.worldPosition.y === y;
            if (atPosition) {
                entities.push(entity);
            }
        }

        return entities;
    }

    getEntitiesWithin(bounds: Bounds): Entity[] {
        const startChunkX = Math.floor(bounds.x1 / ChunkSize);
        const startChunkY = Math.floor(bounds.y1 / ChunkSize);
        const endChunkX = Math.ceil(bounds.x2 / ChunkSize) + 1;
        const endChunkY = Math.ceil(bounds.y2 / ChunkSize) + 1;
        const xChunks = endChunkX - startChunkX;
        const yChunks = endChunkY - startChunkY;

        const entities: Entity[] = [];
        const totalChunks = xChunks * yChunks;

        for (let i = 0; i < totalChunks; i++) {
            // Convert the linear index `i` to chunk coordinates
            const chunkX = startChunkX + (i % xChunks);
            const chunkY = startChunkY + Math.floor(i / xChunks);
            const chunkKey = encodePosition(chunkX, chunkY);

            const chunk = this.chunks.get(chunkKey);
            if (!chunk || chunk.size === 0) continue;

            // Collect entities
            entities.push(...chunk.dense);
        }

        return entities;
    }

    private getOrCreateChunk(chunkKey: number): SparseSet<Entity> {
        const chunk = this.chunks.get(chunkKey);
        if (!!chunk) {
            return chunk;
        } else {
            const set = new SparseSet<Entity>();
            this.chunks.set(chunkKey, set);
            return set;
        }
    }
}

export const ChunkSize = 8;
