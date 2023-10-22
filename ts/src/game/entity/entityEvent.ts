import { Entity } from "./entity.js";

export type EntityEvent = EntityTransformEvent | EntityChildrenUpdatedEvent;

export type EntityTransformEvent = {
    id: "transform";
    source: Entity;
};

export type EntityChildrenUpdatedEvent = {
    id: "child_added" | "child_removed";
    source: Entity;
    target: Entity;
};
