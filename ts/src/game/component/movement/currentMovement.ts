import { Point } from "../../../common/point.js";
import { ComponentEvent } from "../componentEvent.js";
import { MovementComponent } from "./movementComponent.js";

export type CurrentMovement = PathMovement | null;

export type PathMovement = {
    target: Point;
    path: Point[];
};

export class CurrentMovementUpdatedEvent extends ComponentEvent<MovementComponent> {
    constructor(
        public movement: CurrentMovement,
        sourceComponent: MovementComponent,
    ) {
        super(sourceComponent);
    }
}
