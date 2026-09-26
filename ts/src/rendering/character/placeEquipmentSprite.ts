import { SPRITE_W, type SpriteRef } from "../../asset/sprite.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import type { Rectangle } from "../../common/structure/rectangle.ts";
import type { Facing } from "./characterAnimation.ts";
import {
    EquipmentSpriteVariantType,
    type EquipmentSprite,
    type EquipmentSpriteVariant,
} from "./characterColors.ts";

/** `x` and `y` are the sprite's top-left, in the attach box's space. */
export type EquipmentPlacement = {
    sprite: SpriteRef;
    x: number;
    y: number;
    flipX: boolean;
};

/**
 * Unflipped, the grip lands on the attach box's top-left pixel. Flipped, the
 * placement mirrors across the box, so the grip lands on its top-right. For a
 * one-pixel anchor that is the same pixel. For a part's bounds it keeps worn
 * equipment centred on the part.
 *
 * Returns null for an unknown sprite, which the render scope would not draw
 * either.
 */
export function placeEquipmentSprite(
    variant: EquipmentSpriteVariant,
    facing: Facing,
    attachBox: Rectangle,
): EquipmentPlacement | null {
    const { equipmentSprite, flipX } = selectEquipmentSprite(variant, facing);
    const definition = spriteRegistry.resolve(equipmentSprite.sprite);
    if (!definition) {
        return null;
    }

    const y = attachBox.y - equipmentSprite.offset.y;
    if (!flipX) {
        return {
            sprite: equipmentSprite.sprite,
            x: attachBox.x - equipmentSprite.offset.x,
            y,
            flipX: false,
        };
    }

    // The flip reverses columns within the sprite: column g lands at width - 1 - g.
    const flippedGripX = definition[SPRITE_W] - 1 - equipmentSprite.offset.x;
    const attachRightX = attachBox.x + attachBox.width - 1;
    return {
        sprite: equipmentSprite.sprite,
        x: attachRightX - flippedGripX,
        y,
        flipX: true,
    };
}

function selectEquipmentSprite(
    variant: EquipmentSpriteVariant,
    facing: Facing,
): { equipmentSprite: EquipmentSprite; flipX: boolean } {
    switch (variant.type) {
        case EquipmentSpriteVariantType.Single:
            return { equipmentSprite: variant, flipX: false };
        case EquipmentSpriteVariantType.PerFacing:
            return { equipmentSprite: variant.sprites[facing], flipX: false };
        case EquipmentSpriteVariantType.Mirrored:
            return {
                equipmentSprite: variant,
                flipX: facing === "sw" || facing === "nw",
            };
    }
}
