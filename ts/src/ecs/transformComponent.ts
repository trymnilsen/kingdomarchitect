import { Point, zeroPoint } from "../common/point.js";
import { EcsComponent } from "./ecsComponent.js";
import { EcsEntity } from "./ecsEntity.js";

/**
 * The transform component has a special relationship with the ecs as it is
 * both used in the world and added to all new entities
 */
export class TransformComponent extends EcsComponent {
    constructor(public position: Point = zeroPoint()) {
        super();
    }
}
