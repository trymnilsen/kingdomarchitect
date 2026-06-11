import type { Point } from "../../common/point.ts";
import type { Building } from "../../data/building/building.ts";
import type { Entity } from "../entity/entity.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { clearDecorativeResourcesAt } from "./clearDecorativeResources.ts";

/**
 * Places a scaffolded building owned by `owner` (a kingdom or camp entity) at
 * the given world position. This is the single entry point for putting a new
 * construction site into the world: it claims the tile by removing any
 * decorative resources (grass and similar) before the building lands, so
 * every placement path gets the same tile semantics.
 *
 * Returns the placed building entity so callers can queue construction jobs
 * against it.
 */
export function placeBuildingAt(
    root: Entity,
    owner: Entity,
    building: Building,
    point: Point,
): Entity {
    clearDecorativeResourcesAt(root, point);
    const buildingEntity = buildingPrefab(building, true);
    owner.addChild(buildingEntity);
    buildingEntity.worldPosition = point;
    return buildingEntity;
}
