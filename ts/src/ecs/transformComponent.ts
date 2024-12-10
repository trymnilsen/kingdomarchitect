import { Point, zeroPoint } from "../common/point.js";
import { EcsEntity } from "./ecsEntity.js";

/**
 * The transform component has a special relationship with the ecs as it is
 * both used in the world and added to all new entities
 */
export class TransformComponent {
    public localPosition: Point;
    public worldPosition: Point;
    public parent?: EcsEntity;
    public children?: Set<EcsEntity>;

    constructor(initialPosition: Point = zeroPoint()) {
        this.localPosition = initialPosition;
        this.worldPosition = initialPosition; // Defaults to the same as local initially.
    }
}
