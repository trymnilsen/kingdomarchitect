import { generateId } from "../../../../common/idGenerator.js";
import { subtractPoint } from "../../../../common/point.js";
import { workerPrefab } from "../../../prefab/workerPrefab.js";
import { EntityComponent } from "../../entityComponent.js";
import { HousingComponent } from "../../housing/housingComponent.js";
import { findClosestAvailablePosition } from "../../root/path/availability.js";

export class SpawnWorkerComponent extends EntityComponent {
    override onUpdate(tick: number): void {
        if (tick % 60 > 0) return;

        const houses = this.entity
            .queryComponents(HousingComponent)
            .filter((house) => !house.residentId);

        if (houses.length > 0) {
            const workersToCreate = Math.max(
                1,
                Math.round(Math.random() * houses.length),
            );
            console.log("Workers to create: ", workersToCreate);
            for (let i = 0; i < workersToCreate; i++) {
                const house = houses[i];
                const worker = workerPrefab(generateId("worker"));
                const closestPosition = findClosestAvailablePosition(
                    house.entity,
                );

                if (!!closestPosition) {
                    worker.worldPosition = closestPosition;
                    house.residentId = worker.id;
                    this.entity.addChild(worker);
                    console.log("Spawned new worker:", worker);
                }
            }
        }
    }
}
