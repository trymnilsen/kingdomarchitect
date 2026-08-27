import type { Entity } from "../entity/entity.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { ProductionComponentId } from "../component/productionComponent.ts";
import { getInventoryItemById } from "../../data/inventory/inventoryItemHelpers.ts";
import { getResourceById } from "../../data/inventory/items/naturalResource.ts";
import { getProductionDefinition } from "../../data/production/productionDefinition.ts";
import type { Jobs } from "./job.ts";

export function getJobDisplayName(root: Entity, job: Jobs): string | null {
    switch (job.id) {
        case "craftingJob": {
            return `Craft ${job.recipe.name}`;
        }
        case "buildBuildingJob": {
            const buildingEntity = root.findEntity(job.entityId);
            if (!buildingEntity) {
                return "Build building";
            }
            const buildingComp =
                buildingEntity.getEcsComponent(BuildingComponentId);
            return buildingComp
                ? `Build ${buildingComp.building.name}`
                : "Build building";
        }
        case "collectResource": {
            const resourceEntity = root.findEntity(job.entityId);
            if (!resourceEntity) {
                return "Collect resource";
            }
            const resourceComp =
                resourceEntity.getEcsComponent(ResourceComponentId);
            if (!resourceComp) {
                return "Collect resource";
            }
            const resource = getResourceById(resourceComp.resourceId);
            return resource ? `Collect ${resource.name}` : "Collect resource";
        }
        case "collectItem": {
            const item = getInventoryItemById(job.itemId);
            return item ? `Collect ${item.name}` : "Collect item";
        }
        case "productionJob": {
            const prodEntity = root.findEntity(job.targetBuilding);
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
        case "dismantleBuildingJob": {
            const buildingEntity = root.findEntity(job.entityId);
            const buildingComp =
                buildingEntity?.getEcsComponent(BuildingComponentId);
            // Scaffolds being torn down read as "Cancel", completed as "Dismantle",
            // matching the player-facing button label.
            const verb = buildingComp?.scaffolded ? "Cancel" : "Dismantle";
            return buildingComp
                ? `${verb} ${buildingComp.building.name}`
                : "Dismantle building";
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
