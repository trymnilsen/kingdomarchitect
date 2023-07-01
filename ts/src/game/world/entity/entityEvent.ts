import { Entity } from "./entity.js";

export type EntityEvent = EntityTransformEvent | EntityChildrenUpdatedEvent;

export interface EntityTransformEvent {
    id: "transform";
    source: Entity;
}

export interface EntityChildrenUpdatedEvent {
    id: "child_added" | "child_removed";
    source: Entity;
    target: Entity;
}
