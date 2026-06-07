import type { Entity } from "../entity/entity.ts";
import { VisibilityComponentId } from "../component/visibilityComponent.ts";

/**
 * How far a worker can see, in tiles, before illumination is considered. This is
 * the placeholder innate sight every worker has until equippable torches and
 * lanterns extend it; it matches the radius workers had when reach was a baked
 * diamond pattern.
 */
export const WORKER_VISION_REACH = 2;

/**
 * How far a building can see on its own, in tiles, before illumination is
 * considered. Buildings have a short reach: they anchor a place but do not survey
 * the surrounding land the way a worker does.
 */
export const BUILDING_VISION_REACH = 1;

/**
 * The sum of all modifiers acting on an entity's vision reach right now. This is
 * the seam for the future modifier stack — scars, traits, equipment, a vantage
 * tile bonus — each of which will read its own components and contribute here.
 *
 * It is deliberately empty for this stage: it returns 0 so reach equals the
 * entity's base radius. Keeping it as a real (if empty) function means the
 * derive-on-read shape is already in place and the modifier stack lands here
 * without touching the call sites.
 *
 * @param _entity the viewer whose modifiers would be summed (unused for now)
 */
export function visionReachModifiers(_entity: Entity): number {
    return 0;
}

/**
 * The vision reach an entity actually has this moment: its stored base radius plus
 * whatever the modifier stack currently grants. Derived on read so a future
 * modifier can change reach (e.g. equipping a lantern) without rebuilding any
 * stored pattern.
 *
 * Returns 0 for an entity without a {@link VisibilityComponent} — it sees only
 * the tile it stands on — which keeps callers from having to null-check the
 * component before asking for reach.
 *
 * @param entity the viewer to measure
 */
export function visionReachRadius(entity: Entity): number {
    const visibility = entity.getEcsComponent(VisibilityComponentId);
    if (!visibility) {
        return 0;
    }
    return visibility.baseReach + visionReachModifiers(entity);
}
