import { arrayToOject } from "../../../common/array.js";
import { Entity } from "../../entity/entity.js";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../entityComponent.js";
import { HousingComponent } from "./housingComponent.js";

export class LodgingComponent extends EntityComponent {
    override onStart(_tick: number): void {
        this.performLodgingCheck();
    }

    override onUpdate(tick: number): void {
        if (tick % 30 > 0) return;
        this.performLodgingCheck();
    }

    private performLodgingCheck() {
        //Query for all house buildings
        //Query for all workers
        //If more houses than workers, spawn a worker
        //If more workers than houses set homeless effect
        //remove homeless effect if need
        const houses = this.entity.queryComponents(HousingComponent);
        const workers = this.entity.queryComponents(WorkerBehaviorComponent);

        const availableHouses: HousingComponent[] = [];
        const housesWithNonExistingWorkers: HousingComponent[] = [];

        const workerMap = arrayToOject(workers, (item) => item.entity.id);

        for (let i = 0; i < houses.length; i++) {
            const house = houses[i];
            if (house.residentId == null) {
                availableHouses.push(house);
            }

            if (!!house.residentId) {
                if (!!workerMap[house.residentId]) {
                    // Remove the worker from the map of workers so we can use
                    // this to check which workers are homeless later
                    delete workerMap[house.residentId];
                } else {
                    // Set the resident id to null if the worker no longer exists
                    house.residentId = null;
                }
            }
        }

        // Loop over the remaining workers and attempt to add them to a house
        for (const worker of Object.values(workerMap)) {
            const availableHouse = availableHouses.pop();
            if (!!availableHouse) {
                availableHouse.residentId = worker.entity.id;
                this.removeHomelessEffect(worker.entity);
            } else {
                this.addHomelessEffect(worker.entity);
            }
        }
    }

    private removeHomelessEffect(_worker: Entity) {}
    private addHomelessEffect(_worker: Entity) {}
}
