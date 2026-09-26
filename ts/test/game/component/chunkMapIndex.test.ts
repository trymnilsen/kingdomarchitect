import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    ChunkMapComponentId,
    createChunkMap,
    getEntitiesAt,
    getEntitiesInChunk,
    getEntitiesInChunkMapWithin,
    indexEntity,
    type ChunkMap,
} from "../../../src/game/component/chunkMapComponent.ts";
import {
    createSpriteComponent,
    SpriteComponentId,
} from "../../../src/game/component/spriteComponent.ts";
import { spriteRefs } from "../../../src/asset/sprite.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";

function addSpriteEntity(
    parent: Entity,
    id: string,
    x: number,
    y: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(spriteRefs.empty_sprite));
    // position before parenting so child_added indexes the right tile
    entity.position = { x, y };
    parent.addChild(entity);
    return entity;
}

function chunkMapOf(root: Entity): ChunkMap {
    return root.requireEcsComponent(ChunkMapComponentId).chunkMap;
}

function entityAt(id: string, x: number, y: number): Entity {
    const entity = new Entity(id);
    entity.worldPosition = { x, y };
    return entity;
}

describe("chunk map index", () => {
    describe("getEntitiesAt", () => {
        it("returns a fresh array that is safe to remove from while iterating", () => {
            const { root } = createMinimalWorld();
            addSpriteEntity(root, "a", 3, 3);
            addSpriteEntity(root, "b", 3, 3);

            for (const entity of getEntitiesAt(chunkMapOf(root), 3, 3)) {
                entity.remove();
            }

            assert.deepStrictEqual(getEntitiesAt(chunkMapOf(root), 3, 3), []);
        });

        it("moves children with their parent and drops them with it", () => {
            const { root } = createMinimalWorld();
            const camp = new Entity("camp");
            camp.position = { x: 2, y: 2 };
            root.addChild(camp);
            const goblin = addSpriteEntity(camp, "goblin", 3, 2);
            const chunkMap = chunkMapOf(root);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 3, 2), [goblin]);

            camp.position = { x: 4, y: 2 };
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 3, 2), []);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 5, 2), [goblin]);

            camp.remove();
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 5, 2), []);
        });

        it("indexes an entity given a sprite after it entered the world", () => {
            const { root } = createMinimalWorld();
            addSpriteEntity(root, "neighbour", 4, 3);
            const late = new Entity("late");
            late.position = { x: 3, y: 3 };
            root.addChild(late);
            late.setEcsComponent(
                createSpriteComponent(spriteRefs.empty_sprite),
            );
            const chunkMap = chunkMapOf(root);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 3, 3), [late]);

            late.position = { x: 5, y: 3 };

            assert.deepStrictEqual(getEntitiesAt(chunkMap, 5, 3), [late]);
            assert.ok(
                getEntitiesInChunk(chunkMap, { x: 0, y: 0 }).includes(late),
            );
        });

        it("drops an entity whose sprite is taken away", () => {
            const { root } = createMinimalWorld();
            const entity = addSpriteEntity(root, "fading", 3, 3);

            entity.removeEcsComponent(SpriteComponentId);

            assert.deepStrictEqual(getEntitiesAt(chunkMapOf(root), 3, 3), []);
        });
    });

    describe("getEntitiesInChunkMapWithin", () => {
        it("returns the chunks the bounds overlap and no neighbours", () => {
            const chunkMap = createChunkMap();
            const inside = entityAt("inside", 0, 0);
            indexEntity(chunkMap, inside);
            indexEntity(chunkMap, entityAt("right", ChunkSize, 0));
            indexEntity(chunkMap, entityAt("below", 0, ChunkSize));

            const found = getEntitiesInChunkMapWithin(chunkMap, {
                x1: 0,
                y1: 0,
                x2: ChunkSize - 1,
                y2: ChunkSize - 1,
            });

            assert.deepStrictEqual(found, [inside]);
        });
    });
});
