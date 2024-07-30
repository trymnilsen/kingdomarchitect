import { isPointAdjacentTo, Point } from "../../../src/common/point.js";
import { Entity } from "../../../src/game/entity/entity.js";

export class EntityTestProxy {
    private _movement: CapturedMovement;
    private _entity: Entity;
    public get movement(): CapturedMovement {
        return this._movement;
    }

    public get entity(): Entity {
        return this._entity;
    }

    constructor(entity: Entity) {
        this._entity = entity;
        this._movement = new CapturedMovement();
        this._entity.entityEvents.listen((entityEvent) => {
            if (entityEvent.id == "transform") {
                this._movement.addMovement(entityEvent.source.worldPosition);
            }
        });
    }
}

export class CapturedMovement {
    private _movement: Point[] = [];

    public get movement(): Point[] {
        return this._movement;
    }

    addMovement(point: Point) {
        this._movement.push(point);
    }

    wasAdjacentTo(point: Point): boolean {
        return this._movement.some((value) => isPointAdjacentTo(value, point));
    }
}
