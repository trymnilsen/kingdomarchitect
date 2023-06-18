import { generateId } from "../../../../common/idGenerator";
import { firstChildWhere } from "../../entity/child/first";
import { Entity } from "../../entity/entity";
import { workerPrefab } from "../../prefab/workerPrefab";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent";
import { EntityComponent } from "../entityComponent";
import { HealthComponent } from "../health/healthComponent";
import { TenantComponent } from "./tenantComponent";

/**
 * The housing component manages npcs living in a building and
 * spawing the npcs/workers if there are no-one living here
 */
export class HousingComponent extends EntityComponent {
    private startTime = 0;
    private resident: Entity | null = null;

    override onStart(tick: number): void {
        super.onStart(tick);
        //Look for any homeless workers
        if (!this.resident) {
            const homelessWorker = firstChildWhere(
                this.entity.getRootEntity(),
                (entity) => {
                    const workerComponent = entity.getComponent(
                        WorkerBehaviorComponent
                    );
                    const tenantComponent =
                        entity.getComponent(TenantComponent);
                    return !!workerComponent && !tenantComponent;
                }
            );

            if (!!homelessWorker) {
                this.setHouseOnTenant(homelessWorker);
            }
        }
    }

    override onUpdate(tick: number): void {
        if (this.startTime == 0) {
            this.startTime = tick;
        }

        if (!this.resident && tick - this.startTime > 60) {
            const buildingHpComponent =
                this.entity.getComponent(HealthComponent);

            if (!buildingHpComponent) {
                throw new Error("No building hp component present");
            }
            if (buildingHpComponent.healthPercentage >= 1.0) {
                const worker = workerPrefab(generateId("worker"));
                this.resident = worker;
                this.setHouseOnTenant(worker);
                this.entity.getRootEntity().addChild(worker);
            }
        }
    }

    private setHouseOnTenant(entity: Entity) {
        const existingTenantComponent = entity.getComponent(TenantComponent);
        if (!!existingTenantComponent) {
            existingTenantComponent.house = this.entity;
        } else {
            const tenant = new TenantComponent();
            tenant.house = this.entity;
            entity.addComponent(tenant);
        }
    }
}
