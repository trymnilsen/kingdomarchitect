import { EntityComponent } from "../componentOld/entityComponent.js";
import { Entity } from "./entity.js";

export type EntityEvent =
    | EntityTransformEvent
    | EntityChildrenUpdatedEvent
    | ComponentsUpdatedEvent;

type FindEventById<Id extends EntityEvent["id"], EventUnion = EntityEvent> =
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
    [K in EntityEvent["id"]]: FindEventById<K>;
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
    item: EntityComponent;
};
