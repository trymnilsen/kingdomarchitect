import { generateId } from "../../../common/idGenerator.js";
import { firstChildWhere } from "../../entity/child/first.js";
import { Entity } from "../../entity/entity.js";
import { workerPrefab } from "../../prefab/workerPrefab.js";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";
import { TenantComponent } from "./tenantComponent.js";

type HousingBundle = {
    startTime: number;
    residentEntityId: string | null;
};

/**
 * The housing component manages npcs living in a building and
 * spawing the npcs/workers if there are no-one living here
 */
export class HousingComponent extends EntityComponent<HousingBundle> {
    private startTime = 0;
    private _residentEntityId: string | null = null;

    public get residentEntityId(): string | null {
        return this._residentEntityId;
    }

    override onStart(tick: number): void {
        super.onStart(tick);
        //Look for any homeless workers
        if (!this._residentEntityId) {
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

            if (homelessWorker) {
                this.setHouseOnTenant(homelessWorker);
            }
        }
    }

    override onUpdate(tick: number): void {
        if (this.startTime == 0) {
            this.startTime = tick;
        }

        if (!this._residentEntityId && tick - this.startTime > 60) {
            //Check if there are any homeless workers
            //If there was no homless workers, spawn a new one
            //for this house.
            //TODO: Should spawning be moved to some other component?
            const buildingHpComponent =
                this.entity.getComponent(HealthComponent);

            if (!buildingHpComponent) {
                throw new Error("No building hp component present");
            }
            if (buildingHpComponent.healthPercentage >= 1.0) {
                const worker = workerPrefab(generateId("worker"));
                this._residentEntityId = worker.id;
                this.setHouseOnTenant(worker);
                this.entity.getRootEntity().addChild(worker);
            }
        }
    }

    override fromComponentBundle(bundle: HousingBundle): void {
        this._residentEntityId = bundle.residentEntityId;
        this.startTime = bundle.startTime;
    }

    override toComponentBundle(): HousingBundle {
        return {
            startTime: this.startTime,
            residentEntityId: this._residentEntityId,
        };
    }

    private setHouseOnTenant(entity: Entity) {
        const existingTenantComponent = entity.getComponent(TenantComponent);
        if (existingTenantComponent) {
            existingTenantComponent.houseEntityId = this.entity.id;
        } else {
            const tenant = new TenantComponent();
            tenant.houseEntityId = this.entity.id;
            entity.addComponent(tenant);
            this._residentEntityId = entity.id;
        }
    }
}
