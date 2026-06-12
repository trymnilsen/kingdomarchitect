import assert from "node:assert";
import { describe, it } from "node:test";
import type { Bounds } from "../../../src/common/bounds.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { forEachComponentWithin } from "../../../src/game/component/chunkMapComponent.ts";
import {
    SpriteComponentId,
    createSpriteComponent,
} from "../../../src/game/component/spriteComponent.ts";
import {
    VisibilityComponentId,
    createVisibilityComponent,
} from "../../../src/game/component/visibilityComponent.ts";
import { spriteRefs } from "../../../src/asset/sprite.ts";

/**
 * Adds a sprite-bearing entity (so the chunk map indexes it) at a world tile
 * position, optionally with extra components, and returns it. Position is set
 * before parenting so it is indexed into the correct chunk on child_added.
 */
function addSpriteEntity(
    root: Entity,
    id: string,
    x: number,
    y: number,
    withVisibility = false,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(spriteRefs.empty_sprite));
    if (withVisibility) {
        entity.setEcsComponent(createVisibilityComponent(2));
    }
    entity.position = { x, y };
    root.addChild(entity);
    return entity;
}

// Covers chunks x:1..3, y:0..3 (ChunkSize 8): floor(10/8)=1, ceil(24/8)+1=4.
const viewport: Bounds = { x1: 10, y1: 6, x2: 24, y2: 22 };

function visitSpriteIds(root: Entity): string[] {
    const ids: string[] = [];
    forEachComponentWithin(root, viewport, SpriteComponentId, (entity) => {
        ids.push(entity.id);
    });
    return ids;
}

describe("forEachComponentWithin", () => {
    it("visits sprite entities in overlapping chunks and skips far-away ones", () => {
        const { root } = createMinimalWorld({ minChunk: -1, maxChunk: 4 });
        addSpriteEntity(root, "inView", 12, 8); // chunk (1,1)
        addSpriteEntity(root, "inView2", 20, 20); // chunk (2,2)
        addSpriteEntity(root, "farAway", 200, 200); // chunk (25,25)

        const visited = visitSpriteIds(root);

        assert.deepStrictEqual(new Set(visited), new Set(["inView", "inView2"]));
        assert.ok(!visited.includes("farAway"));
    });

    it("visits each matching entity exactly once", () => {
        const { root } = createMinimalWorld();
        addSpriteEntity(root, "a", 12, 8);
        addSpriteEntity(root, "b", 13, 9);

        const visited = visitSpriteIds(root);

        assert.strictEqual(visited.length, 2);
        assert.strictEqual(new Set(visited).size, 2);
    });

    it("does not visit non-sprite entities (they are not spatially indexed)", () => {
        const { root } = createMinimalWorld();
        addSpriteEntity(root, "sprite", 12, 8);

        // A bare entity with no sprite is invisible to the chunk map.
        const ghost = new Entity("ghost");
        ghost.position = { x: 13, y: 9 };
        root.addChild(ghost);

        assert.deepStrictEqual(visitSpriteIds(root), ["sprite"]);
    });

    it("includes edge entities within the one-chunk margin (no exact-bounds cut)", () => {
        const { root } = createMinimalWorld({ minChunk: -1, maxChunk: 4 });
        // x=30 is outside the viewport (x2=24) but lives in chunk x=3, which the
        // margin includes — so it must still be visited rather than pop out.
        addSpriteEntity(root, "edge", 30, 8);

        assert.deepStrictEqual(visitSpriteIds(root), ["edge"]);
    });

    it("filters by component: visibility query visits only visibility+sprite entities", () => {
        const { root } = createMinimalWorld();
        addSpriteEntity(root, "viewer", 12, 8, /* withVisibility */ true);
        addSpriteEntity(root, "plainSprite", 13, 9, /* withVisibility */ false);

        const visited: string[] = [];
        forEachComponentWithin(
            root,
            viewport,
            VisibilityComponentId,
            (entity, component) => {
                // The narrowed component is handed straight to the visitor.
                assert.strictEqual(component.id, VisibilityComponentId);
                visited.push(entity.id);
            },
        );

        assert.deepStrictEqual(visited, ["viewer"]);
    });

    it("falls back to a full tree walk when the root has no chunk map", () => {
        // Bare root, no ChunkMapComponent: the fallback ignores bounds and walks
        // the whole tree, filtering by component only.
        const root = new Entity("root");
        const child = new Entity("child");
        child.setEcsComponent(createSpriteComponent(spriteRefs.empty_sprite));
        child.position = { x: 500, y: 500 }; // nowhere near the viewport
        root.addChild(child);

        assert.deepStrictEqual(visitSpriteIds(root), ["child"]);
    });
});
