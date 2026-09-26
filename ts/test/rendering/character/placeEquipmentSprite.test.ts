import { describe, it } from "node:test";
import assert from "node:assert";
import { SPRITE_W, spriteRefs, type SpriteRef } from "../../../src/asset/sprite.ts";
import { spriteRegistry } from "../../../src/asset/spriteRegistry.ts";
import type { Rectangle } from "../../../src/common/structure/rectangle.ts";
import { fishingRodItem } from "../../../src/data/inventory/items/equipment.ts";
import type { Facing } from "../../../src/rendering/character/characterAnimation.ts";
import {
    EquipmentSpriteVariantType,
    type EquipmentSprite,
    type EquipmentSpriteVariant,
} from "../../../src/rendering/character/characterColors.ts";
import {
    placeEquipmentSprite,
    type EquipmentPlacement,
} from "../../../src/rendering/character/placeEquipmentSprite.ts";

const allFacings: readonly Facing[] = ["se", "sw", "ne", "nw"];

function spriteWidth(sprite: SpriteRef): number {
    const definition = spriteRegistry.resolve(sprite);
    assert.ok(definition, `sprite ${sprite.spriteId} is not registered`);
    return definition[SPRITE_W];
}

/**
 * Where the grip pixel is drawn. Follows the render scope's flip, which draws
 * column g at width - 1 - g.
 */
function drawnGripColumn(placement: EquipmentPlacement, gripX: number): number {
    if (placement.flipX) {
        return placement.x + (spriteWidth(placement.sprite) - 1 - gripX);
    }
    return placement.x + gripX;
}

function place(
    variant: EquipmentSpriteVariant,
    facing: Facing,
    attachBox: Rectangle,
): EquipmentPlacement {
    const placement = placeEquipmentSprite(variant, facing, attachBox);
    assert.ok(placement, `no placement for ${facing}`);
    return placement;
}

describe("placeEquipmentSprite", () => {
    const anchor: Rectangle = { x: 14, y: 11, width: 1, height: 1 };

    const mirroredSword: {
        type: typeof EquipmentSpriteVariantType.Mirrored;
    } & EquipmentSprite = {
        type: EquipmentSpriteVariantType.Mirrored,
        sprite: spriteRefs.character_sword,
        offset: { x: 3, y: 7 },
    };

    it("puts a mirrored sprite's grip pixel on the anchor in every facing", () => {
        for (const variant of [fishingRodItem.visual, mirroredSword]) {
            for (const facing of allFacings) {
                const placement = place(variant, facing, anchor);
                assert.strictEqual(
                    placement.flipX,
                    facing === "sw" || facing === "nw",
                );
                assert.strictEqual(
                    drawnGripColumn(placement, variant.offset.x),
                    anchor.x,
                    `${variant.sprite.spriteId} facing ${facing}`,
                );
                assert.strictEqual(placement.y + variant.offset.y, anchor.y);
            }
        }
    });

    it("mirrors part-bound equipment across the part's bounds", () => {
        const hat: EquipmentSpriteVariant = {
            type: EquipmentSpriteVariantType.Mirrored,
            sprite: spriteRefs.wizard_hat,
            offset: { x: 6, y: 10 },
        };
        const headBounds: Rectangle = { x: 12, y: 5, width: 4, height: 3 };
        const width = spriteWidth(spriteRefs.wizard_hat);

        const east = place(hat, "se", headBounds);
        const west = place(hat, "sw", headBounds);

        // Reflecting across the bounds maps column c to (2x + width - 1) - c,
        // taking the east sprite's rightmost column to the west's leftmost.
        const reflectedLeft =
            2 * headBounds.x + headBounds.width - 1 - (east.x + width - 1);
        assert.strictEqual(west.x, reflectedLeft);
        assert.strictEqual(west.y, east.y);
    });

    it("puts each facing's own sprite and grip on the anchor", () => {
        const variant: EquipmentSpriteVariant = {
            type: EquipmentSpriteVariantType.PerFacing,
            sprites: {
                se: { sprite: spriteRefs.fishingrod, offset: { x: 1, y: 7 } },
                sw: { sprite: spriteRefs.wizard_hat, offset: { x: 5, y: 7 } },
                ne: { sprite: spriteRefs.character_sword, offset: { x: 2, y: 6 } },
                nw: { sprite: spriteRefs.torches, offset: { x: 9, y: 4 } },
            },
        };
        for (const facing of allFacings) {
            const expected = variant.sprites[facing];
            const placement = place(variant, facing, anchor);
            assert.strictEqual(placement.sprite, expected.sprite);
            assert.strictEqual(placement.flipX, false);
            assert.strictEqual(
                drawnGripColumn(placement, expected.offset.x),
                anchor.x,
            );
            assert.strictEqual(placement.y + expected.offset.y, anchor.y);
        }
    });
});
