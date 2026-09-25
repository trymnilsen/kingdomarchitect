import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    ChunkMapComponentId,
    collectEntitiesInRow,
    createChunkMap,
    getEntitiesAt,
    getEntitiesInChunk,
    getEntitiesInChunkMapWithin,
    indexEntity,
    unindexEntity,
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

function idsInRow(root: Entity, y: number, x1: number, x2: number): string[] {
    const out: Entity[] = [];
    collectEntitiesInRow(chunkMapOf(root), y, x1, x2, out);
    return out.map((entity) => entity.id);
}

describe("chunk map index", () => {
    describe("getEntitiesAt", () => {
        it("returns only the entities on the tile, not the whole chunk", () => {
            const { root } = createMinimalWorld();
            addSpriteEntity(root, "a", 3, 3);
            addSpriteEntity(root, "b", 3, 3);
            addSpriteEntity(root, "neighbour", 4, 3);

            const ids = getEntitiesAt(chunkMapOf(root), 3, 3).map((e) => e.id);

            assert.deepStrictEqual(ids.sort(), ["a", "b"]);
        });

        it("returns a fresh array that is safe to remove from while iterating", () => {
            const { root } = createMinimalWorld();
            addSpriteEntity(root, "a", 3, 3);
            addSpriteEntity(root, "b", 3, 3);

            for (const entity of getEntitiesAt(chunkMapOf(root), 3, 3)) {
                entity.remove();
            }

            assert.deepStrictEqual(getEntitiesAt(chunkMapOf(root), 3, 3), []);
        });

        it("follows an entity as it moves, within and across chunks", () => {
            const { root } = createMinimalWorld();
            const mover = addSpriteEntity(root, "mover", 1, 1);
            const chunkMap = chunkMapOf(root);

            mover.position = { x: 2, y: 1 };
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 1, 1), []);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 2, 1), [mover]);

            mover.position = { x: ChunkSize + 2, y: 1 };
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 2, 1), []);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, ChunkSize + 2, 1), [
                mover,
            ]);
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 0, y: 0 }),
                [],
            );
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 1, y: 0 }),
                [mover],
            );
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

        it("indexes a replaced sprite only once", () => {
            const { root } = createMinimalWorld();
            const gate = addSpriteEntity(root, "gate", 3, 3);

            gate.setEcsComponent(
                createSpriteComponent(spriteRefs.empty_sprite),
            );

            const chunkMap = chunkMapOf(root);
            assert.deepStrictEqual(getEntitiesAt(chunkMap, 3, 3), [gate]);
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 0, y: 0 }),
                [gate],
            );
        });

        it("drops an entity whose sprite is taken away", () => {
            const { root } = createMinimalWorld();
            const entity = addSpriteEntity(root, "fading", 3, 3);

            entity.removeEcsComponent(SpriteComponentId);

            assert.deepStrictEqual(getEntitiesAt(chunkMapOf(root), 3, 3), []);
        });

        it("does not index entities without a sprite", () => {
            const { root } = createMinimalWorld();
            const ghost = new Entity("ghost");
            ghost.position = { x: 3, y: 3 };
            root.addChild(ghost);

            assert.deepStrictEqual(getEntitiesAt(chunkMapOf(root), 3, 3), []);
        });
    });

    describe("indexEntity", () => {
        it("indexes the entity on the tile it stands on and in its chunk", () => {
            const chunkMap = createChunkMap();
            const entity = entityAt("tree", 3, 5);

            indexEntity(chunkMap, entity);

            assert.deepStrictEqual(getEntitiesAt(chunkMap, 3, 5), [entity]);
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 0, y: 0 }),
                [entity],
            );
        });

        it("puts the tiles either side of a chunk border in different chunks", () => {
            const chunkMap = createChunkMap();
            const lastInFirst = entityAt("last", ChunkSize - 1, 0);
            const firstInSecond = entityAt("first", ChunkSize, 0);

            indexEntity(chunkMap, lastInFirst);
            indexEntity(chunkMap, firstInSecond);

            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 0, y: 0 }),
                [lastInFirst],
            );
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: 1, y: 0 }),
                [firstInSecond],
            );
        });

        it("indexes negative coordinates in the chunk below zero", () => {
            const chunkMap = createChunkMap();
            const entity = entityAt("west", -1, -ChunkSize);

            indexEntity(chunkMap, entity);

            assert.deepStrictEqual(getEntitiesAt(chunkMap, -1, -ChunkSize), [
                entity,
            ]);
            assert.deepStrictEqual(
                getEntitiesInChunk(chunkMap, { x: -1, y: -1 }),
                [entity],
            );
        });
    });

    describe("unindexEntity", () => {
        it("removes only that entity, from its tile and its chunk", () => {
            const chunkMap = createChunkMap();
            const first = entityAt("first", 3, 5);
            const second = entityAt("second", 3, 5);
            const third = entityAt("third", 3, 5);
            indexEntity(chunkMap, first);
            indexEntity(chunkMap, second);
            indexEntity(chunkMap, third);

            unindexEntity(chunkMap, first);

            assert.deepStrictEqual(
                new Set(getEntitiesAt(chunkMap, 3, 5)),
                new Set([second, third]),
            );
            assert.deepStrictEqual(
                new Set(getEntitiesInChunk(chunkMap, { x: 0, y: 0 })),
                new Set([second, third]),
            );
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

    describe("collectEntitiesInRow", () => {
        it("collects the row left to right, across chunk borders", () => {
            const { root } = createMinimalWorld({ minChunk: -1, maxChunk: 2 });
            addSpriteEntity(root, "right", ChunkSize + 1, 5);
            addSpriteEntity(root, "left", -2, 5);
            addSpriteEntity(root, "middle", 3, 5);

            assert.deepStrictEqual(
                idsInRow(root, 5, -ChunkSize, 2 * ChunkSize),
                ["left", "middle", "right"],
            );
        });

        it("stops exactly at the bounds", () => {
            const { root } = createMinimalWorld();
            addSpriteEntity(root, "before", 1, 5);
            addSpriteEntity(root, "first", 2, 5);
            addSpriteEntity(root, "last", 4, 5);
            addSpriteEntity(root, "after", 5, 5);
            addSpriteEntity(root, "otherRow", 3, 6);

            assert.deepStrictEqual(idsInRow(root, 5, 2, 4), ["first", "last"]);
        });

        it("appends to the given array rather than replacing it", () => {
            const { root } = createMinimalWorld();
            const existing = addSpriteEntity(root, "existing", 0, 0);
            addSpriteEntity(root, "found", 3, 5);

            const out = [existing];
            collectEntitiesInRow(chunkMapOf(root), 5, 0, 7, out);

            assert.deepStrictEqual(
                out.map((entity) => entity.id),
                ["existing", "found"],
            );
        });
    });
});
