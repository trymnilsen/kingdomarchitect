import { Event } from "../../../../src/common/event.js";
import { Point } from "../../../../src/common/point.js";
import { EnergyComponent } from "../../../../src/game/componentOld/energy/energyComponent.js";
import {
    CurrentMovement,
    CurrentMovementUpdatedEvent,
} from "../../../../src/game/componentOld/movement/currentMovement.js";
import { MovementComponent } from "../../../../src/game/componentOld/movement/movementComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { EntityEvent } from "../../../../src/game/entity/entityEvent.js";
import { BoundMethod } from "../../../../util/boundDecorator.js";

export class MovementComponentWrapper {
    private _onMovementUpdated: Event<CurrentMovement> = new Event();
    private _movementUpdates: number = 0;
    private _movementComponent: MovementComponent;
    private _energyComponent: EnergyComponent;
    private _entityMovement: Point[] = [];

    public get movementUpdates(): number {
        return this._movementUpdates;
    }

    public get onMovementUpdated(): Event<CurrentMovement> {
        return this._onMovementUpdated;
    }

    public get movementComponent(): MovementComponent {
        return this._movementComponent;
    }

    public get energyComponent(): EnergyComponent {
        return this._energyComponent;
    }

    public get entityMovement(): ReadonlyArray<Point> {
        return this._entityMovement;
    }

    public get entity(): Entity {
        return this._movementComponent.entity;
    }

    constructor(
        movementComponent: MovementComponent,
        energyComponent: EnergyComponent,
    ) {
        this._movementComponent = movementComponent;
        this._energyComponent = energyComponent;

        movementComponent.entity.componentEvents.listen(
            CurrentMovementUpdatedEvent,
            this.onMovementUpdateEvent,
        );
        movementComponent.entity.entityEvents.listen(this.onEntityEvent);
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
