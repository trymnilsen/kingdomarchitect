import { withinRectangle } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { EcsComponent, entityOf } from "../../../ecs/ecsComponent.js";
import { EcsEntity } from "../../../ecs/ecsEntity.js";
import { TransformComponent } from "../../../ecs/transformComponent.js";
import { ColliderComponent } from "./colliderComponent.js";

export class ChunkMapComponent extends EcsComponent {
    private currentTransforms: Map<TransformComponent, string> = new Map();
    private chunkEntities: Map<string, Set<TransformComponent>> = new Map();
    private colliders: Map<TransformComponent, ColliderComponent> = new Map();

    getAt(point: Point): EcsEntity[] {
        const chunkId = this.chunkId(point.x, point.y);
        const transforms = this.chunkEntities.get(chunkId);
        if (!transforms) {
            return [];
        }

        const matchingEntities: EcsEntity[] = [];
        for (const transformInChunk of transforms) {
            const collider = this.colliders.get(transformInChunk);
            if (!collider) {
                continue;
            }

            const within = withinRectangle(
                point.x,
                point.y,
                transformInChunk.position.x,
                transformInChunk.position.y,
                transformInChunk.position.x + collider.width,
                transformInChunk.position.y + collider.height,
            );
            if (within) {
                matchingEntities.push(entityOf(transformInChunk));
            }
        }

        return matchingEntities;
    }

    remove(transform: TransformComponent) {
        const chunkId = this.chunkId(
            transform.position.x,
            transform.position.y,
        );
        this.currentTransforms.delete(transform);
        const chunkSet = this.chunkEntities.get(chunkId);
        if (!!chunkSet) {
            chunkSet.delete(transform);
        }
        this.colliders.delete(transform);
    }

    add(collider: ColliderComponent, transform: TransformComponent) {
        const chunk = this.chunkId(transform.position.x, transform.position.y);
        this.currentTransforms.set(transform, chunk);
        const chunkSet = this.getOrCreateChunkSet(chunk);

        chunkSet.add(transform);
        this.colliders.set(transform, collider);
    }

    updateTransform(transform: TransformComponent) {
        const currentChunk = this.currentTransforms.get(transform);
        if (!currentChunk) {
            throw new Error(`Transform for ${transform.entity} not in map`);
        }

        const newChunk = this.chunkId(
            transform.position.x,
            transform.position.y,
        );

        if (currentChunk == newChunk) {
            //Transform in same chunk, skip
            return;
        }

        const chunkSet = this.chunkEntities.get(currentChunk);
        if (!chunkSet) {
            throw new Error(`No set for entities in chunk ${currentChunk}`);
        }

        chunkSet.delete(transform);
        const newChunkSet = this.getOrCreateChunkSet(newChunk);
        newChunkSet.add(transform);
    }

    private getOrCreateChunkSet(chunk: string): Set<TransformComponent> {
        if (this.chunkEntities.has(chunk)) {
            return this.chunkEntities.get(chunk)!;
        } else {
            const set = new Set<TransformComponent>();
            this.chunkEntities.set(chunk, set);
            return set;
        }
    }

    private chunkId(x: number, y: number): string {
        const cx = Math.floor(x / 32);
        const cy = Math.floor(y / 32);
        return `cx${cx}/cy${cy}`;
    }
}
