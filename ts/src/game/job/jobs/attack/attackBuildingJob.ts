import { Entity } from "../../../entity/entity.js";
import { EntityInstanceJobConstraint } from "../../constraint/entityInstanceConstraint.js";
import { Job } from "../../job.js";
import { MoveToBeforeJob } from "../moveToBeforeJob.js";

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
        this.complete();
    }
}
