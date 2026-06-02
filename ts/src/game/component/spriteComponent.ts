import { type Point } from "../../common/point.ts";
import type { SpriteRef } from "../../asset/sprite.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * Defines a currently applied tint to a sprite
 */
export type SpriteTint = {
    /**
     * The css string for the color to apply on a sprite
     */
    color: string;
    /**
     * For how long should this tint be applied. Only counts [DrawMode.Tick]
     * frames. Set to a negative number like -1 to keep it until its reset
     */
    frames: number;
};

export function constantTint(color: string): SpriteTint {
    return {
        color: color,
        frames: -1,
    };
}

export function damageTint(): SpriteTint {
    return {
        color: "white",
        frames: 1,
    };
}

export type SpriteComponent = {
    id: typeof SpriteComponentId;
    /**
     * Reference to the sprite to render. Use the SpriteRegistry to resolve
     * this to a SpriteDefinition at render time.
     */
    sprite: SpriteRef;
    frame: number;
    offset?: Point;
    size?: Point;
    tint?: SpriteTint;
    /**
     * Secondary sort key used when two entities share the same Y position.
     * Higher depth renders on top. Defaults to 0.
     */
    depth?: number;
};

/**
 * Creates a new sprite component
 * @param sprite the sprite reference
 * @param offset an optional offset
 * @param size an optional size
 * @param tint an optional tint
 * @returns the constructed SpriteComponent
 */
export function createSpriteComponent(
    sprite: SpriteRef,
    offset?: Point,
    size?: Point,
    tint?: SpriteTint,
    depth?: number,
): SpriteComponent {
    return {
        id: SpriteComponentId,
        frame: 0,
        sprite,
        offset,
        size,
        tint,
        depth,
    };
}

export const SpriteComponentId = "Sprite";

/**
 * Sprite depth for units (workers, goblins). Higher than the building/scenery
 * default of 0 so that when a unit shares a tile's Y with a building — most
 * notably while standing on top of one to craft or sleep — it renders in front
 * instead of being hidden behind the (often scaled-up) building sprite.
 */
export const UNIT_SPRITE_DEPTH = 10;

/**
 * Stacking comparator for `[Entity, SpriteComponent]` entries, sorting
 * back-to-front (draw order): lower world Y first; on a Y tie the lower `depth`
 * first, so the higher-`depth` sprite is drawn last and sits on top. Returns the
 * standard comparator sign.
 *
 * Single source of truth for stacking order. The chunk map only spatially
 * indexes sprite-bearing entities, so both the render query and tap-selection
 * can supply this `[Entity, SpriteComponent]` shape and share this one rule.
 * Reads depth straight from the paired component, so there is no
 * `getEcsComponent` inside the per-frame comparator.
 */
export function compareSpriteStacking(
    a: [Entity, SpriteComponent],
    b: [Entity, SpriteComponent],
): number {
    const yDelta = a[0].worldPosition.y - b[0].worldPosition.y;
    return yDelta !== 0 ? yDelta : (a[1].depth ?? 0) - (b[1].depth ?? 0);
}

/**
 * Entities on one tile ordered top-most first — the reverse of draw order — so
 * tap-cycling visits what the player sees on top first. Pairs each entity with
 * its sprite (guaranteed present: only sprite-bearing entities are spatially
 * indexed) to reuse `compareSpriteStacking`, then unwraps. Returns a new array;
 * the input is left untouched. Cold path (once per tap, few entities).
 */
export function entitiesFrontToBack(entities: readonly Entity[]): Entity[] {
    return entities
        .map((entity): [Entity, SpriteComponent] => [
            entity,
            entity.requireEcsComponent(SpriteComponentId),
        ])
        .sort(compareSpriteStacking)
        .reverse()
        .map(([entity]) => entity);
}
