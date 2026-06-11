import { makeNumberId, type Point } from "../../common/point.ts";
import {
    diamondPatternForRadius,
    generateDiscPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { getLightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";
import { brightestBand, type LightBand } from "../light/lightBand.ts";
import { minimalPerceptionOf, visionReachRadius } from "./visionReach.ts";

/**
 * The tile offsets, centred on the origin, that an entity reveals to the player —
 * everything it lets the player learn about the map. An entity reveals three
 * things, and this is their union:
 *
 *  - its vision-reach diamond: how far it can see by day (or by ambient light),
 *  - if it emits light, the disc that light illuminates: how far it reveals at
 *    night, where sight is governed by light rather than reach, and
 *  - if it has minimal perception, that diamond: what it perceives even in total
 *    darkness.
 *
 * This is the single source of truth for "what does this entity show", used both
 * to stamp fog-of-war discovery as a worker moves and when a building is built.
 * Equippable torches and the future vision modifier stack extend an entity's
 * reveal here, so neither caller has to change when they land.
 *
 * Including the minimal-perception diamond also guarantees the invariant the
 * perceived-band rule rests on: a perception floor is always within reach. For
 * workers it is a subset of the reach diamond today, but nothing forces that for
 * future viewers.
 *
 * The sets are simply concatenated rather than de-duplicated: discovery
 * stamping is idempotent, so overlap between them costs nothing.
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

    const perception = minimalPerceptionOf(entity);
    if (perception) {
        offsets.push(...diamondPatternForRadius(perception.radius));
    }

    return offsets;
}

/**
 * Stamps an entity's minimal perception into the per-frame perception floor:
 * every tile of its perception diamond, at its current world position, floors at
 * the perceived band. Tiles shared by overlapping viewers keep the brightest
 * floor any one of them grants — the same max rule overlapping light sources
 * follow. An entity without minimal perception stamps nothing.
 *
 * Lives beside {@link revealFootprintOffsets} on purpose: both read the
 * perception through `minimalPerceptionOf` and shape it with
 * `diamondPatternForRadius`, which together maintain the invariant the
 * perceived-band rule rests on — a perception floor is always within the reveal
 * footprint, and so within reach.
 *
 * @param entity the viewer whose perception is stamped
 * @param floor the frame's perception floor, keyed by tile number id
 */
export function stampPerceptionFloor(
    entity: Entity,
    floor: Map<number, LightBand>,
): void {
    const perception = minimalPerceptionOf(entity);
    if (!perception) {
        return;
    }
    const points = offsetPatternWithPoint(
        entity.worldPosition,
        diamondPatternForRadius(perception.radius),
    );
    for (const point of points) {
        const numberId = makeNumberId(point.x, point.y);
        floor.set(
            numberId,
            brightestBand(floor.get(numberId) ?? "dark", perception.band),
        );
    }
}
