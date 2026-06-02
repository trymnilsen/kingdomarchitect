import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    compareSpriteStacking,
    createSpriteComponent,
    entitiesFrontToBack,
    SpriteComponentId,
    type SpriteComponent,
    UNIT_SPRITE_DEPTH,
} from "../../../src/game/component/spriteComponent.ts";
import type { Point } from "../../../src/common/point.ts";
import type { SpriteRef } from "../../../src/asset/sprite.ts";

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

function entityAt(id: string, position: Point, depth?: number): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(
        createSpriteComponent(
            testSprite,
            undefined,
            undefined,
            undefined,
            depth,
        ),
    );
    entity.worldPosition = position;
    return entity;
}

function entryOf(entity: Entity): [Entity, SpriteComponent] {
    return [entity, entity.requireEcsComponent(SpriteComponentId)];
}

describe("compareSpriteStacking", () => {
    it("orders lower world Y behind (drawn first)", () => {
        const back = entryOf(entityAt("back", { x: 0, y: 4 }));
        const front = entryOf(entityAt("front", { x: 0, y: 5 }));
        assert.ok(compareSpriteStacking(back, front) < 0);
        assert.ok(compareSpriteStacking(front, back) > 0);
    });

    it("breaks Y ties on depth (higher depth drawn last / on top)", () => {
        const under = entryOf(entityAt("under", { x: 0, y: 5 }, 0));
        const over = entryOf(
            entityAt("over", { x: 0, y: 5 }, UNIT_SPRITE_DEPTH),
        );
        assert.ok(compareSpriteStacking(under, over) < 0);
        assert.ok(compareSpriteStacking(over, under) > 0);
    });

    it("treats identical Y and depth as equal", () => {
        const a = entryOf(entityAt("a", { x: 1, y: 5 }, 3));
        const b = entryOf(entityAt("b", { x: 9, y: 5 }, 3));
        assert.strictEqual(compareSpriteStacking(a, b), 0);
    });

    it("defaults a missing depth to 0", () => {
        const noDepth = entryOf(entityAt("noDepth", { x: 0, y: 5 }));
        const withDepth = entryOf(entityAt("withDepth", { x: 0, y: 5 }, 5));
        assert.ok(compareSpriteStacking(noDepth, withDepth) < 0);
    });

    it("prioritises Y over depth", () => {
        // A high-depth sprite further back still sorts behind a low-depth sprite
        // in front: Y dominates the comparison.
        const backHighDepth = entryOf(
            entityAt("back", { x: 0, y: 4 }, UNIT_SPRITE_DEPTH),
        );
        const frontLowDepth = entryOf(entityAt("front", { x: 0, y: 5 }, 0));
        assert.ok(compareSpriteStacking(backHighDepth, frontLowDepth) < 0);
    });
});

describe("entitiesFrontToBack", () => {
    it("orders top-most (higher Y) first", () => {
        const back = entityAt("back", { x: 0, y: 4 });
        const front = entityAt("front", { x: 0, y: 6 });
        const mid = entityAt("mid", { x: 0, y: 5 });

        const ordered = entitiesFrontToBack([back, front, mid]);

        assert.deepStrictEqual(
            ordered.map((e) => e.id),
            ["front", "mid", "back"],
        );
    });

    it("places a mounted unit ahead of the building it stands on", () => {
        // A worker (UNIT_SPRITE_DEPTH) standing on a building (depth 0) shares
        // the building's tile; the worker must come out first.
        const building = entityAt("building", { x: 12, y: 8 }, 0);
        const worker = entityAt("worker", { x: 12, y: 8 }, UNIT_SPRITE_DEPTH);

        const ordered = entitiesFrontToBack([building, worker]);

        assert.deepStrictEqual(
            ordered.map((e) => e.id),
            ["worker", "building"],
        );
    });

    it("does not mutate the input array", () => {
        const a = entityAt("a", { x: 0, y: 4 });
        const b = entityAt("b", { x: 0, y: 6 });
        const input = [a, b];

        entitiesFrontToBack(input);

        assert.deepStrictEqual(
            input.map((e) => e.id),
            ["a", "b"],
        );
    });
});
