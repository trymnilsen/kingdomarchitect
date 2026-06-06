import { getLightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";
import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";

/**
 * A light source resolved into the form the illumination field consumes: a world
 * position plus the squared radii of its two bands. Radii are pre-squared so
 * band tests can compare against squared distances and avoid `sqrt`.
 *
 * A band whose radius is 0 (e.g. a building's glow emits no bright ring) is
 * stored as a squared radius of -1, which no squared distance can ever satisfy.
 * This is why a 0-radius band emits nothing rather than lighting its own tile.
 */
export type LightEmitter = {
    position: Point;
    brightRadiusSq: number;
    dimRadiusSq: number;
};

function radiusToSquared(radius: number): number {
    return radius > 0 ? radius * radius : -1;
}

/**
 * Gathers every light source in the world, freshly, on each call — there is no
 * cached grid. Every emitter (placed sources and buildings alike) carries a
 * single {@link LightSourceComponent}, so this is one query with no
 * per-source-kind branching: resolve each component's definition and project it
 * from the entity's world position.
 */
export function collectLightEmitters(root: Entity): LightEmitter[] {
    const emitters: LightEmitter[] = [];
    const sources = root.queryComponents(LightSourceComponentId);
    for (const [entity, source] of sources) {
        const definition = getLightSourceDefinition(source.sourceId);
        if (!definition) {
            continue;
        }
        emitters.push({
            position: entity.worldPosition,
            brightRadiusSq: radiusToSquared(definition.brightRadius),
            dimRadiusSq: radiusToSquared(definition.dimRadius),
        });
    }
    return emitters;
}
