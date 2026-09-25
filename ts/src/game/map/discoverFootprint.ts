import type { Point } from "../../common/point.ts";
import {
    diamondPatternForRadius,
    generateDiscPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { WorldDiscoveryComponentId } from "../component/worldDiscoveryComponent.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { resolveLightSource } from "../light/resolveLightSource.ts";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.ts";
import { visionReachRadius } from "../vision/visionReach.ts";

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

export function discoverPoints(root: Entity, entity: Entity, center: Point) {
    if (!root.getEcsComponent(WorldDiscoveryComponentId)) {
        return;
    }

    const points = offsetPatternWithPoint(center, getVisibilityOffsets(entity));
    setDiscoveryForPlayer(root, "player", points);
}
