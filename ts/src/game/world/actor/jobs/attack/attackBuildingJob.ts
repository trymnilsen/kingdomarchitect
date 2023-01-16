import { Entity } from "../../../entity/entity";
import { EntityInstanceJobConstraint } from "../../job/constraint/entityInstanceConstraint";
import { Job } from "../../job/job";
import { MoveToBeforeJob } from "../moveToBeforeJob";

export class AttackBuildingJob extends MoveToBeforeJob {
    constructor(entity: Entity, building: Entity) {
        super(
            new _AttackBuilding(entity),
            new EntityInstanceJobConstraint(entity)
        );
    }
}

class _AttackBuilding extends Job {
    private attackEntity: Entity;

    get tileX(): number {
        return this.attackEntity.position.x;
    }

    get tileY(): number {
        return this.attackEntity.position.y;
    }

    constructor(entity: Entity) {
        super();
        this.attackEntity = entity;
    }

    update(tick: number): void {
        /*         const halfHealth = this.entity.maxHealth / 2;
        if (this.entity.health > halfHealth) {
            this.entity.health = halfHealth;
            console.log(
                `Attacked building, health is now ${this.entity.health}`
            );
        } else {
            console.log(
                `Health less than halfHealth (${halfHealth}): ${this.entity.health} `
            );
        } */
        this.complete();
    }
}
