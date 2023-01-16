import { Point } from "../../../common/point";
import { Entity } from "./entity";

export type EntityEvent = EntityTransformEvent | EntityChildrenUpdatedEvent;

export interface EntityTransformEvent {
    id: "transform";
    source: Entity;
}

export interface EntityChildrenUpdatedEvent {
    id: "child_added" | "child_removed";
    source: Entity;
}
