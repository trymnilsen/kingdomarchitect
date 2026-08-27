import { randomEntry, removeItem } from "../../common/array.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import {
    HousingComponentId,
    type HousingComponent,
} from "../component/housingComponent.ts";
import { PlayerUnitComponentId } from "../component/playerUnitComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import { findClosestAvailablePosition } from "../map/query/closestPositionQuery.ts";
import { workerPrefab } from "../prefab/workerPrefab.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import { KingdomComponentId } from "../component/kingdomComponent.ts";

export const housingSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, _deltaTime: number) {
    const houses = root.queryComponents(HousingComponentId);
    const workers = root.queryComponents(PlayerUnitComponentId);

    const availableHouses: [Entity, HousingComponent][] = [];
    const workersWithHouse: Set<string> = new Set();

    for (const [entity, housingComponent] of houses) {
        const buildingComponent = entity.getEcsComponent(BuildingComponentId);

        // Only consider player-owned housing (wooden houses), not goblin huts
        if (buildingComponent?.building.id !== woodenHouse.id) {
            continue;
        }

        if (buildingComponent?.scaffolded) {
            continue;
        }

        // A tenant can die or despawn, leaving a dangling id on the house.
        const tenantId = housingComponent.tenant;
        if (tenantId) {
            const tenantEntity = root.findEntity(tenantId);
            const tenantExists =
                tenantEntity &&
                tenantEntity.hasComponent(PlayerUnitComponentId);
            if (!tenantExists) {
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
            removeHomelessEffect(entity);
        } else {
            addHomelessEffect(entity);
        }
    }

    // If there are available houses left, spawn a worker
    if (availableHouses.length > 0) {
        const houseEntry = randomEntry(availableHouses);
        const [houseEntity, housingComponent] = houseEntry;
        removeItem(availableHouses, houseEntry);
        const settlement = getSettlementEntity(houseEntity);
        const worker = workerPrefab();
        const spawnPosition = findClosestAvailablePosition(
            root,
            houseEntity.worldPosition,
        );

        if (spawnPosition) {
            housingComponent.tenant = worker.id;
            houseEntity.invalidateComponent(HousingComponentId);
            settlement.addChild(worker);
            worker.worldPosition = spawnPosition;
        }
    }
}

function removeHomelessEffect(_entity: Entity) {
    // TODO: implemented later
}

function addHomelessEffect(_entity: Entity) {
    // TODO: implemented later
}
