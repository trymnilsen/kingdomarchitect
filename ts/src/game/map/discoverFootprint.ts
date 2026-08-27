import type { Point } from "../../common/point.ts";
import {
    diamondPatternForRadius,
    generateDiscPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { MessageEmitterComponentId } from "../component/messageEmitterComponent.ts";
import { WorldDiscoveryComponentId } from "../component/worldDiscoveryComponent.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { resolveLightSource } from "../light/resolveLightSource.ts";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.ts";
import { visionReachRadius } from "../vision/visionReach.ts";

/**
 * The tile offsets, centred on the origin, that an entity discovers for the
 * player. This is the union of two things:
 *
 *  - its discovery diamond, from {@link visionReachRadius}, and
 *  - if it emits light, the footprint that light illuminates. A pattern on the
 *    component wins over the definition's disc, which is how a manned tower's
 *    searchlight wedge joins the tower's discovery footprint without this code
 *    knowing towers exist. The disc comes from {@link resolveLightSource}, so
 *    what an entity carries counts as much as what it is. That changes nothing
 *    for a worker with a torch today, since the radius-2 vision diamond already
 *    contains the torch's radius-1 disc, but it matters as soon as a carried
 *    light outreaches its bearer's eyes.
 *
 * Fog-of-war stamping asks here in all three cases: as a worker moves, when a
 * building finishes, and when the watch system advances a searchlight.
 *
 * The two sets are concatenated rather than de-duplicated, since stamping the
 * same tile twice costs nothing.
 */
export function discoveryFootprintOffsets(entity: Entity): Point[] {
    const offsets = diamondPatternForRadius(visionReachRadius(entity));

    const lightSource = entity.getEcsComponent(LightSourceComponentId);
    if (lightSource) {
        if (lightSource.pattern !== null) {
            offsets.push(...lightSource.pattern);
        } else {
            const definition = resolveLightSource(entity, lightSource);
            if (definition) {
                offsets.push(...generateDiscPattern(definition.lightRadius));
            }
        }
    }

    return offsets;
}

/**
 * Stamps fog-of-war discovery for everything `entity` reveals, placed at
 * `center`. The player permanently remembers the footprint, so a lit area
 * becomes map memory instead of reverting to undiscovered black once the light
 * or the viewer is gone.
 *
 * `center` is passed separately from the entity's own position because callers
 * stamp at different points: a moving worker discovers around the tile it steps
 * onto (before its transform updates), while a finished building discovers
 * around its own world position.
 *
 * @param root the world root, holding the discovery component and message emitter
 * @param entity the viewer or emitter whose reveal is discovered
 * @param center the world tile the footprint is centred on
 */
export function discoverFootprint(root: Entity, entity: Entity, center: Point) {
    // Discovery only exists in a world that tracks it. A root without the
    // discovery state and message emitter (a headless or partial root, as
    // focused tests build) has nothing to stamp, so there is nothing to do.
    const messageEmitter = root.getEcsComponent(MessageEmitterComponentId);
    const tracksDiscovery = !!root.getEcsComponent(WorldDiscoveryComponentId);
    if (!messageEmitter || !tracksDiscovery) {
        return;
    }

    const points = offsetPatternWithPoint(
        center,
        discoveryFootprintOffsets(entity),
    );
    setDiscoveryForPlayer(root, messageEmitter.emitter, "player", points);
}
