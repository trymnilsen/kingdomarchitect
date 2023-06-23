function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { generateId } from "../../../../common/idGenerator.js";
import { firstChildWhere } from "../../entity/child/first.js";
import { workerPrefab } from "../../prefab/workerPrefab.js";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";
import { TenantComponent } from "./tenantComponent.js";
/**
 * The housing component manages npcs living in a building and
 * spawing the npcs/workers if there are no-one living here
 */ export class HousingComponent extends EntityComponent {
    onStart(tick) {
        super.onStart(tick);
        //Look for any homeless workers
        if (!this.resident) {
            const homelessWorker = firstChildWhere(this.entity.getRootEntity(), (entity)=>{
                const workerComponent = entity.getComponent(WorkerBehaviorComponent);
                const tenantComponent = entity.getComponent(TenantComponent);
                return !!workerComponent && !tenantComponent;
            });
            if (!!homelessWorker) {
                this.setHouseOnTenant(homelessWorker);
            }
        }
    }
    onUpdate(tick) {
        if (this.startTime == 0) {
            this.startTime = tick;
        }
        if (!this.resident && tick - this.startTime > 60) {
            const buildingHpComponent = this.entity.getComponent(HealthComponent);
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
    setHouseOnTenant(entity) {
        const existingTenantComponent = entity.getComponent(TenantComponent);
        if (!!existingTenantComponent) {
            existingTenantComponent.house = this.entity;
        } else {
            const tenant = new TenantComponent();
            tenant.house = this.entity;
            entity.addComponent(tenant);
        }
    }
    constructor(...args){
        super(...args);
        _define_property(this, "startTime", 0);
        _define_property(this, "resident", null);
    }
}
