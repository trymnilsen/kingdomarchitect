import type { Point } from "../../../../../common/point.ts";
import { forresterProduction } from "../../../../../data/production/productionDefinition.ts";
import { ProductionComponentId } from "../../../../component/productionComponent.ts";
import type { Entity } from "../../../../entity/entity.ts";
import { getDiamondPoints } from "../../../../map/item/placement.ts";
import { queryEntity } from "../../../../map/query/queryEntity.ts";
import type { BuildingApplicability } from "../buildingApplicability.ts";

export const forresterApplicability: BuildingApplicability = (
    point: Point,
    world: Entity,
) => {
    if (forresterProduction.kind !== "zone") {
        return { isApplicable: true };
    }
    const zonePoints = getDiamondPoints(point, forresterProduction.zoneRadius);
    const tooClose = zonePoints.some((p) => {
        const entities = queryEntity(world, p);
        return entities.some(
            (entity) =>
                entity.getEcsComponent(ProductionComponentId)?.productionId ===
                forresterProduction.id,
        );
    });

    if (tooClose) {
        return {
            isApplicable: false,
            reason: "Too close to another forrester",
        };
    }

    return { isApplicable: true };
};
