import { EntityComponent } from "../component/entityComponent.js";
import { Entity } from "./entity.js";

export type EntityEvent =
    | EntityTransformEvent
    | EntityChildrenUpdatedEvent
    | ComponentsUpdatedEvent;

export type EntityTransformEvent = {
    id: "transform";
    source: Entity;
};

export type EntityChildrenUpdatedEvent = {
    id: "child_added" | "child_removed";
    source: Entity;
    target: Entity;
};

export type ComponentsUpdatedEvent = {
    id: "component_added" | "component_removed";
    source: Entity;
    item: EntityComponent;
};
