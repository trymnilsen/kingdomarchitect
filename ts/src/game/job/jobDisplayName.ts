import type { Entity } from "../entity/entity.ts";
import {
    BuildingComponentId,
} from "../component/buildingComponent.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { ProductionComponentId } from "../component/productionComponent.ts";
import { getResourceById } from "../../data/inventory/items/naturalResource.ts";
import { getProductionDefinition } from "../../data/production/productionDefinition.ts";
import type { Jobs } from "./job.ts";
import type { CraftingJob } from "./craftingJob.ts";
import type { CollectResourceJob } from "./collectResourceJob.ts";
import type { BuildBuildingJob } from "./buildBuildingJob.ts";
import type { ProductionJob } from "./productionJob.ts";

export function getJobDisplayName(root: Entity, job: Jobs): string | null {
    switch (job.id) {
        case "craftingJob": {
            const recipe = (job as CraftingJob).recipe;
            return `Craft ${recipe.name}`;
        }
        case "buildBuildingJob": {
            const buildJob = job as BuildBuildingJob;
            const buildingEntity = root.findEntity(buildJob.entityId);
            if (!buildingEntity) {
                return "Build building";
            }
            const buildingComp = buildingEntity.getEcsComponent(BuildingComponentId);
            return buildingComp ? `Build ${buildingComp.building.name}` : "Build building";
        }
        case "collectResource": {
            const collectJob = job as CollectResourceJob;
            const resourceEntity = root.findEntity(collectJob.entityId);
            if (!resourceEntity) {
                return "Collect resource";
            }
            const resourceComp = resourceEntity.getEcsComponent(ResourceComponentId);
            if (!resourceComp) {
                return "Collect resource";
            }
            const resource = getResourceById(resourceComp.resourceId);
            return resource ? `Collect ${resource.name}` : "Collect resource";
        }
        case "collectItem":
            return "Collect item";
        case "productionJob": {
            const prodJob = job as ProductionJob;
            const prodEntity = root.findEntity(prodJob.targetBuilding);
            if (!prodEntity) {
                return "Produce";
            }
            const prodComp = prodEntity.getEcsComponent(ProductionComponentId);
            if (!prodComp) {
                return "Produce";
            }
            const definition = getProductionDefinition(prodComp.productionId);
            return definition ? definition.actionName : "Produce";
        }
        case "farmPlantJob":
            return "Plant crop";
        case "farmHarvestJob":
            return "Harvest crop";
        case "windmillJob":
            return "Operate windmill";
        case "moveToJob":
            return null;
        default:
            return null;
    }
}
