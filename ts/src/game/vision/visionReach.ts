import type { Entity } from "../entity/entity.ts";
import {
    VisibilityComponentId,
    type MinimalPerception,
} from "../component/visibilityComponent.ts";
import { stationUnderEntity } from "../component/stationQuery.ts";

/**
 * The vision reach a viewer has while standing on a station tile (the stone tower's
 * lookout vantage). A commanding survey that clearly out-ranges a wandering worker.
 */
export const STATION_MANNED_REACH = 8;

/**
 * How far a worker can see, in tiles, before illumination is considered. This is
 * the placeholder innate sight every worker has until equippable torches and
 * lanterns extend it; it matches the radius workers had when reach was a baked
 * diamond pattern.
 */
export const WORKER_VISION_REACH = 2;

/**
 * The sight a worker keeps in total darkness: their own tile and the four
 * cardinal neighbours, perceived dimly. This replaces the old innate "worker
 * glow" light source. The footprint is the same five tiles, but the worker no
 * longer lights them; they merely perceive them. Dim rather than bright so the
 * dark still reads as dark, and so an actual carried light (a torch lights the
 * same plus *brightly*, and for everyone) stays a visible upgrade.
 */
export const WORKER_MINIMAL_PERCEPTION: MinimalPerception = {
    radius: 1,
    band: "dim",
};

/**
 * How far a building can see on its own, in tiles, before illumination is
 * considered. Buildings have a short reach: they anchor a place but do not survey
 * the surrounding land the way a worker does.
 */
export const BUILDING_VISION_REACH = 1;

/**
 * The sum of all modifiers acting on an entity's vision reach right now. This is
 * the seam for the future modifier stack of scars, traits, equipment and a
 * vantage tile bonus, each of which will read its own components and contribute
 * here.
 *
 * It is deliberately empty for this stage: it returns 0 so reach equals the
 * entity's base radius. Keeping it as a real (if empty) function means the
 * derive-on-read shape is already in place and the modifier stack lands here
 * without touching the call sites.
 *
 * @param entity the viewer whose modifiers are summed
 */
export function visionReachModifiers(entity: Entity): number {
    return stationVantageModifier(entity);
}

/**
 * A viewer standing on a station tile (a manned tower) sees from that vantage. The
 * bonus is granted to the viewer on the tile rather than to the station, so it
 * lives and dies with the worker and leaves no reference on the station to
 * dangle. The station
 * itself is excluded so an unmanned tower never gets the bonus from matching its own
 * position.
 */
function stationVantageModifier(entity: Entity): number {
    if (!stationUnderEntity(entity)) {
        return 0;
    }
    const base = entity.getEcsComponent(VisibilityComponentId)?.baseReach ?? 0;
    return STATION_MANNED_REACH - base;
}

/**
 * The vision reach an entity actually has this moment: its stored base radius plus
 * whatever the modifier stack currently grants. Derived on read so a future
 * modifier can change reach (e.g. equipping a lantern) without rebuilding any
 * stored pattern.
 *
 * Returns 0 for an entity without a {@link VisibilityComponent}, meaning it sees
 * only the tile it stands on. That keeps callers from having to null-check the
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

/**
 * The minimal perception an entity has this moment, or undefined for an entity
 * that perceives nothing without light. Derived on read like
 * {@link visionReachRadius}; a future modifier (a trait sharpening night senses,
 * an effect numbing them) lands here without touching call sites.
 *
 * @param entity the viewer to measure
 */
export function minimalPerceptionOf(
    entity: Entity,
): MinimalPerception | undefined {
    return entity.getEcsComponent(VisibilityComponentId)?.minimalPerception;
}
