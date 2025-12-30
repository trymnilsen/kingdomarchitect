import { randomEntry, removeItem } from "../../common/array.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import {
    HousingComponentId,
    type HousingComponent,
} from "../component/housingComponent.ts";
import { PlayerUnitComponentId } from "../component/playerUnitComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { findClosestAvailablePosition } from "../map/query/closestPositionQuery.ts";
import { getOverworldEntity } from "../map/scenes.ts";
import { workerPrefab } from "../prefab/workerPrefab.ts";

export const housingSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, _deltaTime: number) {
    const houses = root.queryComponents(HousingComponentId);
    const workers = root.queryComponents(PlayerUnitComponentId);

    const availableHouses: [Entity, HousingComponent][] = [];
    const workersWithHouse: Set<string> = new Set();

    // Process all houses
    for (const [entity, housingComponent] of houses) {
        const buildingComponent = entity.getEcsComponent(BuildingComponentId);

        // Skip scaffolded buildings
        if (buildingComponent?.scaffolded) {
            continue;
        }

        // Check if the tenant id is still valid
        const tenantId = housingComponent.tenant;
        if (tenantId) {
            const tenantEntity = root.findEntity(tenantId);
            const tenantExists =
                tenantEntity &&
                tenantEntity.hasComponent(PlayerUnitComponentId);
            if (!tenantExists) {
                // Reset to null if a worker with this id does not exist
                housingComponent.tenant = null;
                entity.invalidateComponent(HousingComponentId);
            } else {
                // Add the tenantId so we can skip it later when looking for
                // homeless workers
                workersWithHouse.add(tenantId);
            }
        }

        if (!housingComponent.tenant) {
            // No tenant, add this as an available dwelling
            availableHouses.push([entity, housingComponent]);
        }
    }

    // Process all workers
    for (const [entity, _] of workers) {
        // If the worker has a house, decided in previous loop we skip it
        if (workersWithHouse.has(entity.id)) {
            continue;
        }

        // TODO: Make logic for picking the best house for the worker
        const houseForWorker = availableHouses.pop();
        if (houseForWorker) {
            const [houseEntity, housingComponent] = houseForWorker;
            housingComponent.tenant = entity.id;
            houseEntity.invalidateComponent(HousingComponentId);
            // Remove homeless effect if any
            removeHomelessEffect(entity);
        } else {
            // Assign homeless effect
            addHomelessEffect(entity);
        }
    }

    // If there are available houses left, spawn a worker
    if (availableHouses.length > 0) {
        const houseEntry = randomEntry(availableHouses);
        const [houseEntity, housingComponent] = houseEntry;
        removeItem(availableHouses, houseEntry);
        const overworld = getOverworldEntity(root);
        const worker = workerPrefab();
        const spawnPosition = findClosestAvailablePosition(
            overworld,
            houseEntity.worldPosition,
        );

        if (spawnPosition) {
            worker.worldPosition = spawnPosition;
            housingComponent.tenant = worker.id;
            houseEntity.invalidateComponent(HousingComponentId);
            overworld.addChild(worker);
        }
    }
}

function removeHomelessEffect(_entity: Entity) {
    // TODO: implemented later
}

function addHomelessEffect(_entity: Entity) {
    // TODO: implemented later
}
