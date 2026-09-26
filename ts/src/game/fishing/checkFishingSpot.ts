import type { Point } from "../../common/point.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { getTerrainAt, TileComponentId } from "../component/tileComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { queryEntity } from "../map/query/queryEntity.ts";
import { isShoreWater } from "../map/shoreWater.ts";
import { Terrain } from "../map/terrain.ts";

export type FishingSpotCheck =
    { isFishingSpot: true } | { isFishingSpot: false; reason: string };

/**
 * The one rule the selection state, planner and action all ask, so the player
 * is never offered a spot the worker then refuses
 */
export function checkFishingSpot(root: Entity, point: Point): FishingSpotCheck {
    const tileComponent = root.getEcsComponent(TileComponentId);
    if (
        !tileComponent ||
        getTerrainAt(tileComponent, point) !== Terrain.Water
    ) {
        return { isFishingSpot: false, reason: "Needs to be water" };
    }

    if (!isShoreWater(tileComponent, point)) {
        return {
            isFishingSpot: false,
            reason: "Too far from the bank to reach",
        };
    }

    const isBuiltOver = queryEntity(root, point).some((entity) =>
        entity.hasComponent(BuildingComponentId),
    );
    if (isBuiltOver) {
        return { isFishingSpot: false, reason: "Something is built here" };
    }

    return { isFishingSpot: true };
}
