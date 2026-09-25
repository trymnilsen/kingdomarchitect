import type { Point } from "../../common/point.ts";
import {
    diamondPatternForRadius,
    generateDiscPattern,
} from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { resolveLightSource } from "../light/resolveLightSource.ts";
import { visionReachRadius } from "../vision/visionReach.ts";

/**
 * Points an entity sees as offsets from its position
 */
export function getVisibilityOffsets(entity: Entity): Point[] {
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
