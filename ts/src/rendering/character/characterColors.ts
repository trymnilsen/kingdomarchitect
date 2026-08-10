import type { SpriteRef } from "../../asset/sprite.ts";
import type { Point } from "../../common/point.ts";
import type { Facing } from "./characterAnimation.ts";

/**
 * How a piece of equipment picks its sprite for the frame being drawn.
 * `"single"` always draws the same sprite, `"mirrored"` flips the eastern
 * sprite for western facings, and `"perFacing"` names a sprite per facing with
 * a fallback for the ones it omits.
 */
export type EquipmentSpriteVariant =
    | { type: "single"; sprite: SpriteRef }
    | { type: "mirrored"; east: SpriteRef }
    | {
          type: "perFacing";
          sprites: Partial<Record<Facing, SpriteRef>>;
          fallback: SpriteRef;
      };

/**
 * Equipment pinned to a named anchor point in the character frames (the hands),
 * so it tracks the hand through every frame of an animation.
 */
export type AnchorEquipment = {
    anchor: string;
    offsetInSpriteForAnchorPoint: Point;
    sprite: EquipmentSpriteVariant;
};

/**
 * Equipment placed against the bounds of a body part rather than an anchor, for
 * things that sit on a part instead of being held by it. `z` selects the layer:
 * 0 draws behind the character, 1 in front.
 */
export type PartBoundsEquipment = {
    attachToPart: string;
    offset: Point;
    sprite: EquipmentSpriteVariant;
    z?: 0 | 1;
};

/**
 * The full appearance of a character, as the sprite generator consumes it: part
 * colours plus the equipment drawn over them. This is the contract between
 * whoever decides what a character looks like and the generator that draws it.
 * The character builder devtool writes one of these by hand; the game derives
 * one from a worker's equipment (see `getCharacterColors`).
 */
export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
    Equipment?: Array<AnchorEquipment | PartBoundsEquipment>;
};
