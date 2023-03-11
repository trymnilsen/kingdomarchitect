import { generateId } from "../../../../common/idGenerator";
import { Entity } from "../../entity/entity";
import { workerPrefab } from "../../prefab/workerPrefab";
import { EntityComponent } from "../entityComponent";
import { HealthComponent } from "../health/healthComponent";

/**
 * The housing component manages npcs living in a building and
 * spawing the npcs/workers if there are no-one living here
 *
 */
export class HousingComponent extends EntityComponent {
    private startTime = 0;
    private resident: Entity | undefined;

    constructor(initialResident?: Entity) {
        super();
        this.resident = initialResident;
    }

    override onUpdate(tick: number): void {
        if (this.startTime == 0) {
            this.startTime = tick;
        }

        if (tick - this.startTime > 60 && !this.resident) {
            const buildingHpComponent =
                this.entity.getComponent(HealthComponent);

            if (!buildingHpComponent) {
                throw new Error("No building hp component present");
            }
            if (buildingHpComponent.healthPercentage >= 1.0) {
                const worker = workerPrefab(generateId("worker"));
                this.resident = worker;
                this.entity.getRootEntity().addChild(worker);
            }
        }
    }
}
