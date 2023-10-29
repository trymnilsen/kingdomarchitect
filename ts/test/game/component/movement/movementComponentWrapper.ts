import { Event } from "../../../../src/common/event.js";
import { Point } from "../../../../src/common/point.js";
import {
    CurrentMovement,
    CurrentMovementUpdatedEvent,
} from "../../../../src/game/component/movement/currentMovement.js";
import { MovementComponent } from "../../../../src/game/component/movement/movementComponent.js";
import { EntityEvent } from "../../../../src/game/entity/entityEvent.js";
import { BoundMethod } from "../../../../util/boundDecorator.js";

export class MovementComponentWrapper {
    private _onMovementUpdated: Event<CurrentMovement> = new Event();
    private _movementUpdates: number = 0;
    private _component: MovementComponent;
    private _entityMovement: Point[] = [];

    public get movementUpdates(): number {
        return this._movementUpdates;
    }

    public get onMovementUpdated(): Event<CurrentMovement> {
        return this._onMovementUpdated;
    }

    public get component(): MovementComponent {
        return this._component;
    }

    public get entityMovement(): ReadonlyArray<Point> {
        return this._entityMovement;
    }

    constructor(component: MovementComponent) {
        this._component = component;
        component.entity.componentEvents.listen(
            CurrentMovementUpdatedEvent,
            this.onMovementUpdateEvent,
        );
        component.entity.entityEvents.listen(this.onEntityEvent);
    }

    resetMovementUpdatesCount() {
        this._movementUpdates = 0;
    }
    resetEntityMovement() {
        this._entityMovement = [];
    }

    @BoundMethod()
    private onMovementUpdateEvent(value: CurrentMovementUpdatedEvent): void {
        this._movementUpdates += 1;
        this._onMovementUpdated.publish(value.movement);
    }

    @BoundMethod()
    private onEntityEvent(event: EntityEvent) {
        if (event.id == "transform") {
            this._entityMovement.push(event.source.worldPosition);
        }
    }
}
