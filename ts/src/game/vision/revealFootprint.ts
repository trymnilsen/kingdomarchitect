import type { Point } from "../../common/point.ts";
import {
    diamondPatternForRadius,
    generateDiscPattern,
} from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { getLightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";
import { visionReachRadius } from "./visionReach.ts";

/**
 * The tile offsets, centred on the origin, that an entity reveals to the player —
 * everything it lets the player learn about the map. An entity reveals two things,
 * and this is their union:
 *
 *  - its vision-reach diamond: how far it can see by day (or by ambient light), and
 *  - if it emits light, the disc that light illuminates: how far it reveals at
 *    night, where sight is governed by light rather than reach.
 *
 * This is the single source of truth for "what does this entity show", used both
 * to stamp fog-of-war discovery as a worker moves and when a building is built.
 * Equippable torches and the future vision modifier stack extend an entity's
 * reveal here, so neither caller has to change when they land.
 *
 * The two sets are simply concatenated rather than de-duplicated: discovery
 * stamping is idempotent, so overlap between the reach diamond and the light disc
 * costs nothing.
 *
 * @param entity the viewer or emitter whose reveal is measured
 */
export function revealFootprintOffsets(entity: Entity): Point[] {
    const offsets = diamondPatternForRadius(visionReachRadius(entity));

    const lightSource = entity.getEcsComponent(LightSourceComponentId);
    if (lightSource) {
        const definition = getLightSourceDefinition(lightSource.sourceId);
        if (definition) {
            // The lit footprint reaches as far as the outermost band the source
            // emits, which is normally the dim radius but is the bright radius for
            // any source whose bright reach somehow exceeds it.
            const litRadius = Math.max(
                definition.brightRadius,
                definition.dimRadius,
            );
            offsets.push(...generateDiscPattern(litRadius));
        }
    }

    return offsets;
}
