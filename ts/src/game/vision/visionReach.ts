import type { Entity } from "../entity/entity.ts";
import { VisibilityComponentId } from "../component/visibilityComponent.ts";

/**
 * The radius of the manned watchtower's searchlight wedge, in tiles. The watch
 * system shapes the beam with this and stamps what it sweeps into discovery.
 */
export const STATION_MANNED_REACH = 8;

/**
 * How far a worker discovers the map around itself as it moves, in tiles. This
 * is the innate radius every worker has, and carrying a light does not change
 * it: a torch widens what the worker reveals through the light's own footprint
 * (see `discoveryFootprintOffsets`), not through this reach. How far you can
 * see and how far your light falls stay separate questions.
 */
export const WORKER_VISION_REACH = 2;

/**
 * How far a building discovers on its own, in tiles. Buildings anchor a place
 * without surveying the surrounding land the way a worker does.
 */
export const BUILDING_VISION_REACH = 1;

/**
 * The sum of all modifiers acting on an entity's discovery radius right now.
 * This is the seam for the future modifier stack of scars, traits and
 * equipment, each of which will read its own components and contribute here.
 *
 * It is deliberately empty for this stage: it returns 0 so the radius equals
 * the entity's base value. Keeping it as a real (if empty) function means the
 * derive-on-read shape is already in place and the modifier stack lands here
 * without touching the call sites.
 */
export function visionReachModifiers(_entity: Entity): number {
    return 0;
}

/**
 * The discovery radius an entity actually has this moment: its stored base
 * radius plus whatever the modifier stack currently grants.
 *
 * Returns 0 for an entity without a {@link VisibilityComponent}, meaning it
 * reveals only the tile it stands on. That keeps callers from having to
 * null-check the component before asking for the radius.
 */
export function visionReachRadius(entity: Entity): number {
    const visibility = entity.getEcsComponent(VisibilityComponentId);
    if (!visibility) {
        return 0;
    }
    return visibility.baseReach + visionReachModifiers(entity);
}
