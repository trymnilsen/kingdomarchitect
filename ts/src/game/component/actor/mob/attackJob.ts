import { Entity } from "../../../entity/entity.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { Job } from "../../job/job.js";

type AttackJobBundle = {
    entityId: string;
    damage: number;
};

export class AttackJob extends Job<AttackJobBundle> {
    private target: Entity | null = null;
    private damage = 0;

    static createInstance(entityId: string, damage: number): AttackJob {
        const instance = new AttackJob();
        instance.bundle = {
            entityId,
            damage,
        };
        return instance;
    }

    override update(): void {
        if (!this.target) {
            console.warn(
                "No entity set for job, completing",
                this.target,
                this,
            );
            this.complete();
            return;
        }

        const targetHealthComponent =
            this.target.requireComponent(HealthComponent);

        if (targetHealthComponent?.health === 0) {
            this.complete();
            return;
        }

        if (this.adjacentTo(this.target.worldPosition)) {
            targetHealthComponent?.damage(this.damage, this.entity);
        } else {
            //when called will store the point, and make a path search that is
            //cached
            //on the next calls will check if point is the same and current
            //position is adjacent to the next point in the path
            //if its not adjacent we might have moved inbetween updates
            //(forexample because of an interupt) we will path again
            //this.movement.path(point);
        }
    }

    protected override onPersistJobState(): AttackJobBundle {
        throw new Error("Method not implemented.");
    }

    protected override onFromPersistedState(bundle: AttackJobBundle): void {
        const entityWithId = this.entity
            .getRootEntity()
            .findEntity(bundle.entityId);
        if (!entityWithId) {
            throw new Error("Unable to restore ");
        }

        this.target = entityWithId;
        this.damage = bundle.damage;
    }
}
