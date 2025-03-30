import { Entity } from "../../../entity/entity.js";
import { JobConstraint } from "../jobConstraint.js";

export class IsInstanceJobConstraint implements JobConstraint {
    constructor(private instance: Entity) {}
    rankEntity(entity: Entity): number {
        return this.instance == entity ? 1 : 0;
    }
}
