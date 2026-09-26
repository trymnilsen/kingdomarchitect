import type { SpriteRef } from "../../asset/sprite.ts";
import type { Point } from "../../common/point.ts";
import type { Facing } from "./characterAnimation.ts";

/**
 * `offset` is the grip: the pixel in the sprite, counted from its top-left,
 * that is placed on the attach point.
 */
export type EquipmentSprite = {
    sprite: SpriteRef;
    offset: Point;
};

/**
 * How equipment picks its sprite per facing. `Mirrored` holds the east-facing
 * sprite and flips it for western facings. `PerFacing` is for art that
 * flipping cannot produce.
 */
export const EquipmentSpriteVariantType = {
    Single: 0,
    Mirrored: 1,
    PerFacing: 2,
} as const;

export type EquipmentSpriteVariantType =
    (typeof EquipmentSpriteVariantType)[keyof typeof EquipmentSpriteVariantType];

export type EquipmentSpriteVariant =
    | ({ type: typeof EquipmentSpriteVariantType.Single } & EquipmentSprite)
    | ({ type: typeof EquipmentSpriteVariantType.Mirrored } & EquipmentSprite)
    | {
          type: typeof EquipmentSpriteVariantType.PerFacing;
          sprites: Record<Facing, EquipmentSprite>;
      };

/**
 * Equipment pinned to a named anchor in the character frames (the hands), so
 * it tracks the hand through every frame of an animation.
 */
export type AnchorEquipment = {
    anchor: string;
    sprite: EquipmentSpriteVariant;
};

/**
 * Equipment worn on a body part rather than held at an anchor, such as a hat.
 * `z` selects the layer: 0 behind the character, 1 in front.
 */
export type PartBoundsEquipment = {
    attachToPart: string;
    sprite: EquipmentSpriteVariant;
    z?: 0 | 1;
};

/**
 * The appearance the sprite generator draws. The character builder writes one
 * by hand, and the game derives one from equipment in `getCharacterColors`.
 */
export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
    Equipment?: Array<AnchorEquipment | PartBoundsEquipment>;
};
