import { chebyshevDistance, type Point } from "../../common/point.ts";
import type { Building } from "../../data/building/building.ts";
import { goblinCampfire } from "../../data/building/goblin/goblinCampfire.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { createBuildingPlacementValidator } from "../map/query/buildingPlacementValidator.ts";
import type { PositionValidator } from "../map/query/closestPositionQuery.ts";

/**
 * Tiles this close to a campfire (Chebyshev distance, so diagonals count)
 * are kept free of camp buildings. A radius of 1 keeps the eight tiles
 * around the fire open: goblins warm up by standing next to the fire, and
 * the open ring lets them walk around it instead of squeezing past
 * whatever was built against it.
 */
export const CAMPFIRE_CLEARANCE_RADIUS = 1;

/**
 * Creates a validator for placing a camp building that keeps the clearance
 * ring around campfires open. The invariant is symmetric — no campfire and
 * building may end up within {@link CAMPFIRE_CLEARANCE_RADIUS} of each
 * other — so which positions the candidate must keep clear of depends on
 * what is being placed:
 *
 * - A campfire keeps its own ring clear of every existing camp building,
 *   so a fire rebuilt after being destroyed is not placed against a hut.
 * - Any other building stays outside the ring of every campfire,
 *   scaffolded ones included so a fire under construction is not crowded
 *   before it is finished.
 *
 * Beyond the clearance rule the candidate must pass the generic building
 * placement rules (valid ground, reachability, not trapping neighbours).
 */
export function createCampBuildingPlacementValidator(
    root: Entity,
    campEntity: Entity,
    building: Building,
): PositionValidator {
    const keepClearOf =
        building.id === goblinCampfire.id
            ? campBuildingPositions(campEntity)
            : campCampfirePositions(campEntity);
    const isValidBuildingPlacement = createBuildingPlacementValidator(root);

    return (candidate: Point) =>
        keepClearOf.every(
            (position) =>
                chebyshevDistance(position, candidate) >
                CAMPFIRE_CLEARANCE_RADIUS,
        ) && isValidBuildingPlacement(candidate);
}

/**
 * World positions of every campfire in the camp, scaffolded or completed.
 */
function campCampfirePositions(campEntity: Entity): Point[] {
    return campBuildingPositions(
        campEntity,
        (buildingId) => buildingId === goblinCampfire.id,
    );
}

/**
 * World positions of the camp's buildings, scaffolded or completed,
 * optionally filtered by building id.
 */
function campBuildingPositions(
    campEntity: Entity,
    includeBuilding: (buildingId: string) => boolean = () => true,
): Point[] {
    const positions: Point[] = [];
    for (const child of campEntity.children) {
        const buildingComponent = child.getEcsComponent(BuildingComponentId);
        if (
            buildingComponent &&
            includeBuilding(buildingComponent.building.id)
        ) {
            positions.push(child.worldPosition);
        }
    }
    return positions;
}
