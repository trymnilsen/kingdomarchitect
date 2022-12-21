import { Entity } from "../../../entity/entity";
import { Actor } from "../../actor";
import { ActorInstanceJobConstraint } from "../../job/constraint/actorInstanceConstraint";
import { Job } from "../../job/job";
import { MoveToBeforeJob } from "../moveToBeforeJob";

export class AttackBuildingJob extends MoveToBeforeJob {
    constructor(entity: Entity, actor: Actor) {
        super(
            new _AttackBuilding(entity),
            new ActorInstanceJobConstraint(actor)
        );
    }
}

class _AttackBuilding extends Job {
    private entity: Entity;

    get tileX(): number {
        return this.entity.x;
    }

    get tileY(): number {
        return this.entity.y;
    }

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    update(tick: number): void {
        const halfHealth = this.entity.maxHealth / 2;
        if (this.entity.health > halfHealth) {
            this.entity.health = halfHealth;
            console.log(
                `Attacked building, health is now ${this.entity.health}`
            );
        } else {
            console.log(
                `Health less than halfHealth (${halfHealth}): ${this.entity.health} `
            );
        }
        this.complete();
    }
}
