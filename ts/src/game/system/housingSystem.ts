import { arrayToOject, randomEntry, removeItem } from "../../common/array.js";
import type { ConstructorFunction } from "../../common/constructor.js";
import { generateId } from "../../common/idGenerator.js";
import type { ReadableSet } from "../../common/structure/sparseSet.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { BuildingComponent } from "../component/building/buildingComponent.js";
import { HousingComponent } from "../component/building/housingComponent.js";
import type { EntityComponent } from "../component/entityComponent.js";
import { findClosestAvailablePosition } from "../component/root/path/availability.js";
import { Entity, type EntityId } from "../entity/entity.js";
import { workerPrefab } from "../prefab/workerPrefab.js";

export function housingSystem(rootEntity: Entity) {
    const buildings = rootEntity.queryComponents(HousingComponent);
    const workers = rootEntity.queryComponents(WorkerBehaviorComponent);
    const availableHouses: HousingComponent[] = [];
    const workersWithHouse: Set<string> = new Set();
    for (let i = 0; i < buildings.size; i++) {
        const building = buildings.elementAt(i);
        const component = building.entity.getComponent(BuildingComponent);
        if (component && component.isScaffolded) {
            continue;
        }
        //Check if the resident id is still valid
        const resident = building.residentId;
        if (!!resident) {
            const worker = workers.get(resident);
            if (worker === undefined) {
                //Reset to null if a worker with this id does not exist
                //It might be destroyed
                building.residentId = null;
            } else {
                //Add the residentId so we can skip it later when looking for
                //homeless workers
                workersWithHouse.add(resident);
            }
        } else {
            //No resident, add this sas an available dwelling
            availableHouses.push(building);
        }
    }

    for (let i = 0; i < workers.size; i++) {
        const worker = workers.elementAt(i);
        //If the worker has a house, decided in previous loop we skip it
        if (workersWithHouse.has(worker.entity.id)) {
            continue;
        }

        //TODO Make logic for picking the best house for the worker
        const houseForWorker = availableHouses.pop();
        if (houseForWorker) {
            houseForWorker.residentId = worker.entity.id;
            //Remove homeless effect if any
        } else {
            //Assign homeless effect
        }
    }

    //If there are available houses left, spawn a worker
    if (availableHouses.length > 0) {
        const houseToSpawnBy = randomEntry(availableHouses);
        removeItem(availableHouses, houseToSpawnBy);

        const worker = workerPrefab(generateId("worker"));
        const spawnPosition = findClosestAvailablePosition(
            houseToSpawnBy.entity,
        );

        if (spawnPosition) {
            worker.worldPosition = spawnPosition;
        }

        rootEntity.addChild(worker);
    }
}

function removeHomelessEffect(_entity: Entity) {}

function addHomelessEffect(_entity: Entity) {}
