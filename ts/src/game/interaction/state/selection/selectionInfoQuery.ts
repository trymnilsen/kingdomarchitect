import { spriteRefs } from "../../../../asset/sprite.ts";
import { getCropDefinition } from "../../../../data/crop/cropDefinitions.ts";
import { getResourceById } from "../../../../data/inventory/items/naturalResource.ts";
import { getRoleDefinition } from "../../../../data/role/roleDefinitions.ts";
import { BehaviorAgentComponentId } from "../../../component/BehaviorAgentComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../component/collectableComponent.ts";
import {
    type FarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../component/farmComponent.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { InventoryComponentId } from "../../../component/inventoryComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { RoleComponentId } from "../../../component/worker/roleComponent.ts";
import { SpriteComponentId } from "../../../component/spriteComponent.ts";
import {
    getConstructionMaterialProgress,
    type ConstructionMaterialProgress,
} from "../../../building/materialQuery.ts";
import { getSettlementEntity } from "../../../entity/settlementQueries.ts";
import { getJobDisplayName } from "../../../job/jobDisplayName.ts";
import { getJobForWorker } from "../../../job/jobQuery.ts";
import {
    ambientIsLight,
    collectLightClaims,
    computeLitTiles,
    isTileLit,
} from "../../../light/lightClaims.ts";
import { DayComponentId } from "../../../component/dayComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import type { Point } from "../../../../common/point.ts";
import type { StateContext } from "../../handler/stateContext.ts";
import { SelectedEntityItem } from "../../selection/selectedEntityItem.ts";
import { SelectedTileItem } from "../../selection/selectedTileItem.ts";
import { type SelectedWorldItem } from "../../selection/selectedWorldItem.ts";
import type { SelectionInfo } from "./selectionInfo.ts";

/**
 * Work out the title, subtitle and icon shown in the selection panel.
 *
 * The answer depends on which components the selected entity happens to carry,
 * so this reads as a sequence of probes rather than a lookup. Later probes
 * overwrite the name set by earlier ones, which is how a worker with a role
 * ends up labelled by its role instead of its building. Returns null when there
 * is nothing worth showing, such as an empty tile.
 */
export function buildSelectionInfo(
    selection: SelectedWorldItem,
    context: StateContext,
): SelectionInfo | null {
    if (selection instanceof SelectedTileItem) {
        return tileSelectionInfo(selection, context);
    }
    if (selection instanceof SelectedEntityItem) {
        return entitySelectionInfo(selection, context);
    }
    return null;
}

function tileSelectionInfo(
    selection: SelectedTileItem,
    context: StateContext,
): SelectionInfo | null {
    const type = selection.groundTile.type;
    if (!type) {
        return null;
    }
    return {
        title: type,
        subtitle: "Tile",
        icon: spriteRefs.blue_book,
        lit: tileLitAt(context.root, selection.tilePosition),
    };
}

/**
 * Whether one tile is currently lit, for the selection readout. Presentational
 * only. It derives through the shared coverage functions so it can never
 * disagree with the renderer, and the ambient short-circuit skips the coverage
 * build entirely outside night.
 */
function tileLitAt(root: Entity, tilePosition: Point): boolean {
    // A world without a day component is fully visible, so default to day.
    const phase = root.getEcsComponent(DayComponentId)?.phase ?? "day";
    if (ambientIsLight(phase)) {
        return true;
    }
    const litTiles = computeLitTiles(collectLightClaims(root, "illumination"));
    return isTileLit(litTiles, phase, tilePosition);
}

function entitySelectionInfo(
    selection: SelectedEntityItem,
    context: StateContext,
): SelectionInfo {
    const entity = selection.entity;

    let icon = spriteRefs.empty_sprite;
    const spriteComponent = entity.getEcsComponent(SpriteComponentId);
    if (spriteComponent) {
        icon = spriteComponent.sprite;
    }

    // A collectable stands in for its contents, so it reports the item rather
    // than the entity holding it and skips everything below.
    const collectableComponent = entity.getEcsComponent(CollectableComponentId);
    if (collectableComponent && hasCollectableItems(collectableComponent)) {
        const firstItem = collectableComponent.items[0].item;
        return {
            icon: firstItem.asset,
            title: firstItem.name,
            subtitle: collectableComponent.reason ?? "Collectable",
        };
    }

    let name = "Entity";
    let materials: ConstructionMaterialProgress[] | undefined;
    const buildingComponent = entity.getEcsComponent(BuildingComponentId);
    if (buildingComponent) {
        name = `${entity.id} - ${buildingComponent.building.name}`;
        if (buildingComponent.scaffolded) {
            const inventory = entity.getEcsComponent(InventoryComponentId);
            materials = getConstructionMaterialProgress(
                inventory,
                buildingComponent.building.requirements,
                getSettlementEntity(entity),
            );
        }
    }

    const resourceComponent = entity.getEcsComponent(ResourceComponentId);
    if (resourceComponent) {
        const resource = getResourceById(resourceComponent.resourceId);
        if (resource) {
            name = `${entity.id} - ${resource.name}`;
        }
    }

    const roleComponent = entity.getEcsComponent(RoleComponentId);
    if (roleComponent) {
        const roleDefinition = getRoleDefinition(roleComponent.role);
        name = roleDefinition.name;
    }

    if (entity.hasComponent(GoblinUnitComponentId)) {
        name = `${entity.id}`;
    }

    const farmComponent = entity.getEcsComponent(FarmComponentId);
    if (farmComponent) {
        return {
            icon,
            title: name,
            subtitle: farmSubtitle(farmComponent, context),
        };
    }

    let subtitle = "selected";
    const behaviorAgent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (behaviorAgent) {
        const claimedJob = getJobForWorker(entity);
        let jobName: string | null = null;
        if (claimedJob) {
            jobName = getJobDisplayName(entity.getRootEntity(), claimedJob);
        }

        if (jobName) {
            subtitle = jobName;
        } else {
            const behaviorName = behaviorAgent.currentBehaviorName ?? "idle";
            if (behaviorName === "stepOutside") {
                subtitle = "stepping outside";
            } else {
                const actionType = behaviorAgent.actionQueue[0]?.type;
                if (actionType) {
                    subtitle = `${behaviorName} - ${actionType}`;
                } else {
                    subtitle = behaviorName;
                }
            }
        }
    }

    if (buildingComponent?.scaffolded) {
        subtitle = "Under construction";
    }

    return {
        icon,
        subtitle,
        title: name,
        materials,
    };
}

/**
 * Describe where a farm plot is in its growth cycle.
 *
 * Growing plots cap at 99 percent so the player never reads a full bar on a
 * crop that cannot be harvested yet.
 */
function farmSubtitle(
    farmComponent: FarmComponent,
    context: StateContext,
): string {
    const cropDefinition = getCropDefinition(farmComponent.cropId);

    if (farmComponent.state === FarmState.Empty) {
        return `${cropDefinition.name} (empty)`;
    }

    if (farmComponent.state === FarmState.Growing) {
        let progress = 100;
        if (cropDefinition.growthDuration > 0) {
            progress = Math.floor(
                ((context.gameTime.tick - farmComponent.plantedAtTick) /
                    cropDefinition.growthDuration) *
                    100,
            );
        }
        return `growing (${Math.min(progress, 99)}%)`;
    }

    return `${cropDefinition.name} ready`;
}
