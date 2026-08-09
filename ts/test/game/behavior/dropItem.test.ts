import assert from "node:assert";
import { describe, it } from "node:test";
import type { Entity } from "../../../src/game/entity/entity.ts";
import {
    dropItemAtPosition,
    DropMode,
    MAX_GROUND_ITEMS_PER_TILE,
} from "../../../src/game/behavior/dropItem.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import { queryEntity } from "../../../src/game/map/query/queryEntity.ts";
import {
    berryItem,
    gemResource,
    ironOreItem,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import { createMinimalWorld } from "../testWorld.ts";
import type { Point } from "../../../src/common/point.ts";

const TILE: Point = { x: 6, y: 4 };

function pilesAt(root: Entity, point: Point): Entity[] {
    return queryEntity(root, point).filter((entity) =>
        entity.hasComponent(GroundItemComponentId),
    );
}

function stacksOn(pile: Entity) {
    return pile.requireEcsComponent(CollectableComponentId).items;
}

describe("dropItemAtPosition", () => {
    it("keeps one pile per item type on a tile", () => {
        const { root } = createMinimalWorld();

        dropItemAtPosition(root, 1, TILE, woodResourceItem, 3, "test");
        dropItemAtPosition(root, 1, TILE, stoneResource, 2, "test");

        const piles = pilesAt(root, TILE);
        assert.strictEqual(piles.length, 2);
        for (const pile of piles) {
            assert.strictEqual(
                stacksOn(pile).length,
                1,
                "a pile is a single stack of a single type",
            );
        }
    });

    it("merges a repeat drop of the same type into one stack", () => {
        const { root } = createMinimalWorld();

        dropItemAtPosition(root, 1, TILE, woodResourceItem, 3, "test");
        dropItemAtPosition(root, 1, TILE, woodResourceItem, 4, "test");

        const piles = pilesAt(root, TILE);
        assert.strictEqual(piles.length, 1, "no second wood pile appears");
        const stacks = stacksOn(piles[0]);
        assert.strictEqual(stacks.length, 1);
        assert.strictEqual(stacks[0].amount, 7);
    });

    it("merges a copied item definition rather than adding a second stack", () => {
        const { root } = createMinimalWorld();

        dropItemAtPosition(root, 1, TILE, woodResourceItem, 3, "test");
        // Callers that hand over a copy (a clone, a deserialised save) must not
        // split the pile — stacks are keyed by item id, not object identity.
        dropItemAtPosition(
            root,
            1,
            TILE,
            structuredClone(woodResourceItem),
            2,
            "test",
        );

        const piles = pilesAt(root, TILE);
        assert.strictEqual(piles.length, 1);
        assert.strictEqual(stacksOn(piles[0])[0].amount, 5);
    });

    it("pushes a new type off a tile that is already at its pile cap", () => {
        const { root } = createMinimalWorld();
        const types = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
        ];
        assert.strictEqual(types.length, MAX_GROUND_ITEMS_PER_TILE);

        for (const item of types) {
            dropItemAtPosition(
                root,
                1,
                TILE,
                item,
                1,
                "test",
                DropMode.Nearest,
            );
        }
        assert.strictEqual(
            pilesAt(root, TILE).length,
            MAX_GROUND_ITEMS_PER_TILE,
        );

        dropItemAtPosition(
            root,
            1,
            TILE,
            berryItem,
            1,
            "test",
            DropMode.Nearest,
        );

        assert.strictEqual(
            pilesAt(root, TILE).length,
            MAX_GROUND_ITEMS_PER_TILE,
            "the full tile does not grow a fifth pile",
        );
        const berries: Entity[] = [];
        for (const [entity] of root.queryComponents(GroundItemComponentId)) {
            if (
                stacksOn(entity).some((stack) => stack.item.id === berryItem.id)
            ) {
                berries.push(entity);
            }
        }
        assert.strictEqual(berries.length, 1, "the berries land somewhere");
        assert.notDeepStrictEqual(
            berries[0].worldPosition,
            TILE,
            "and that somewhere is a neighbouring tile",
        );
    });

    it("holds the cap in the default mode too", () => {
        const { root } = createMinimalWorld();
        const types = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
            berryItem,
            gemResource,
        ];

        // No DropMode: the caller vouches for the tile, which is what dropHeld
        // does when a worker leaves something at its feet. Vouching for a tile
        // is not vouching for its capacity.
        for (const item of types) {
            dropItemAtPosition(root, 1, TILE, item, 1, "test");
        }

        assert.strictEqual(
            pilesAt(root, TILE).length,
            MAX_GROUND_ITEMS_PER_TILE,
            "the tile stops at the cap instead of stacking every type on it",
        );

        let placed = 0;
        for (const [entity] of root.queryComponents(GroundItemComponentId)) {
            placed += stacksOn(entity).length;
        }
        assert.strictEqual(placed, types.length, "and nothing was destroyed");
    });

    it("still merges into a full tile when the type already lies there", () => {
        const { root } = createMinimalWorld();
        const types = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
        ];
        for (const item of types) {
            dropItemAtPosition(
                root,
                1,
                TILE,
                item,
                1,
                "test",
                DropMode.Nearest,
            );
        }

        // Merging consumes no slot, so a full tile must still accept this.
        dropItemAtPosition(
            root,
            1,
            TILE,
            stoneResource,
            5,
            "test",
            DropMode.Nearest,
        );

        const piles = pilesAt(root, TILE);
        assert.strictEqual(piles.length, MAX_GROUND_ITEMS_PER_TILE);
        const stone = piles.find((pile) =>
            stacksOn(pile).some((stack) => stack.item.id === stoneResource.id),
        )!;
        assert.strictEqual(stacksOn(stone)[0].amount, 6);
    });

    it("stamps the drop tick and refreshes it when topped up", () => {
        const { root } = createMinimalWorld();

        dropItemAtPosition(root, 100, TILE, gemResource, 1, "test");
        const pile = pilesAt(root, TILE)[0];
        assert.strictEqual(
            pile.requireEcsComponent(GroundItemComponentId).droppedAtTick,
            100,
        );

        dropItemAtPosition(root, 340, TILE, gemResource, 1, "test");
        assert.strictEqual(
            pile.requireEcsComponent(GroundItemComponentId).droppedAtTick,
            340,
            "fresh goods restart the pile's decay clock",
        );
    });
});
