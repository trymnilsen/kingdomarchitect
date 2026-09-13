import type { Point } from "../../common/point.ts";
import { AttackTargetKind } from "../../data/combat/attackProfileDefinition.ts";
import { HealthComponentId } from "../component/healthComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { queryEntity } from "../map/query/queryEntity.ts";
import type { AttackTarget } from "./attackTarget.ts";

/**
 * The tile an attack would land on, null when the thing aimed at is gone.
 */
export function resolveTargetPoint(
    root: Entity,
    target: AttackTarget,
): Point | null {
    if (target.kind === AttackTargetKind.Tile) {
        return target.point;
    }

    const entity = root.findEntity(target.id);
    if (!entity) {
        return null;
    }
    return entity.worldPosition;
}

export function resolveTargets(
    root: Entity,
    target: AttackTarget,
    impact: Point,
): Entity[] {
    let candidates: Entity[] = [];
    if (target.kind === AttackTargetKind.Entity) {
        const entity = root.findEntity(target.id);
        if (entity) {
            candidates = [entity];
        }
    } else {
        candidates = queryEntity(root, impact);
    }

    return candidates.filter((entity) =>
        entity.hasComponent(HealthComponentId),
    );
}
