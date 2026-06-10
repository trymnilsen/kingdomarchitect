import assert from "node:assert";
import { addPoint } from "../../src/common/point.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../src/game/component/chunkMapComponent.ts";
import { SpriteComponentId } from "../../src/game/component/spriteComponent.ts";
import type { Entity } from "../../src/game/entity/entity.ts";

/**
 * Structural invariants the world must maintain regardless of how it was
 * built (generation, prefabs, persistence load, replication). Tests apply
 * these after exercising a world-mutating flow to catch desyncs that
 * behavioral assertions miss.
 */

/**
 * Asserts the scenegraph transform invariant below the given entity:
 * every entity's world position equals its parent's world position plus
 * its own local position.
 */
export function assertTransformsConsistent(entity: Entity) {
    for (const child of entity.children) {
        assert.deepStrictEqual(
            child.worldPosition,
            addPoint(entity.worldPosition, child.position),
            `world position of ${child.id} should equal its parent's world position plus its local position`,
        );
        assertTransformsConsistent(child);
    }
}

/**
 * Asserts the chunk map (spatial index) matches the entity tree: every
 * sprite-bearing entity in the tree is reachable through getEntitiesAt at
 * its world position, and the map holds no entities that are missing from
 * the tree.
 */
export function assertChunkMapMatchesTree(root: Entity) {
    const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
    const treeEntities = new Set<Entity>();
    collectDescendants(root, treeEntities);

    for (const entity of treeEntities) {
        if (!entity.hasComponent(SpriteComponentId)) {
            continue;
        }
        const found = getEntitiesAt(
            chunkMap,
            entity.worldPosition.x,
            entity.worldPosition.y,
        );
        assert.ok(
            found.includes(entity),
            `${entity.id} should be indexed in the chunk map at (${entity.worldPosition.x},${entity.worldPosition.y})`,
        );
    }

    for (const chunk of chunkMap.chunks.values()) {
        for (let i = 0; i < chunk.size; i++) {
            const entity = chunk.elementAt(i);
            assert.ok(
                treeEntities.has(entity),
                `chunk map holds ${entity.id}, which is not in the entity tree`,
            );
        }
    }
}

function collectDescendants(entity: Entity, into: Set<Entity>) {
    for (const child of entity.children) {
        into.add(child);
        collectDescendants(child, into);
    }
}
