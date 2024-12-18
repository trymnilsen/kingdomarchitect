import { EcsEvent } from "./ecsEvent.js";
import { TransformComponent } from "../transformComponent.js";
import { Point } from "../../common/point.js";

export class EcsTransformEvent extends EcsEvent {
    constructor(
        public transform: TransformComponent,
        public newPosition: Point,
        public oldPosition: Point,
    ) {
        super();
    }
}
