import { Entity } from "../../../entity/entity.js";
import { BuildingComponent } from "../../building/buildingComponent.js";
import { assertEntityComponent } from "../../entityComponent.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { Job } from "../job.js";

type BuildBundle = {
    entityId: string;
}

export class BuildJob extends Job<BuildBundle> {
    private buildingComponent: BuildingComponent | null = null;
    private healthComponent: HealthComponent | null = null;

    static createInstance(building: Entity): BuildJob {
        const instance = new BuildJob();
        instance.bundle = {
            entityId: building.id,
        };

        return instance;
    }

    update(): void {
        assertEntityComponent(this.healthComponent);
        assertEntityComponent(this.buildingComponent);

        const target = this.buildingComponent.entity.worldPosition;
        if (this.adjacentTo(target)) {
            if (this.healthComponent.healthPercentage < 1) {
                this.healthComponent.heal(10);
            }
            if (this.healthComponent.healthPercentage >= 1) {
                this.buildingComponent.finishBuild();
                this.complete();
            }
        } else {
            this.movement.pathTowards(target);
        }
    }

    protected override onFromPersistedState(bundle: BuildBundle): void {
        const entityWithId = this.entity
            .getRootEntity()
            .findEntity(bundle.entityId);

        if (!entityWithId) {
            throw new Error(`Entity not found with id ${bundle.entityId}`);
        }

        this.healthComponent = entityWithId.requireComponent(HealthComponent);
        this.buildingComponent =
            entityWithId.requireComponent(BuildingComponent);
    }

    protected override onPersistJobState(): BuildBundle {
        assertEntityComponent(this.buildingComponent);

        return {
            entityId: this.buildingComponent.entity.id,
        };
    }
}
