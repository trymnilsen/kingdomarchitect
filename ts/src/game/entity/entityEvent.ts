import type { ComponentType } from "../component/component.js";
import { Entity } from "./entity.js";

export type EntityEvent =
    | EntityTransformEvent
    | EntityChildrenUpdatedEvent
    | ComponentsUpdatedEvent;

export type EntityEventId = EntityEvent["id"];

type FindEventById<Id extends EntityEventId, EventUnion = EntityEvent> =
    // Distribute over the EventUnion (EntityEvent)
    EventUnion extends { id: infer EventIdType }
        ? // Check if the target Id (e.g., "child_added") is assignable to this specific Event's id type (e.g., "child_added" | "child_removed")
          Id extends EventIdType
            ? // If yes, this is the Event type we want for this Id
              EventUnion
            : never
        : never;

// The dynamically generated map using the helper
export type EntityEventMap = {
    [K in EntityEventId]: FindEventById<K>;
};

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
    item: ComponentType;
};
