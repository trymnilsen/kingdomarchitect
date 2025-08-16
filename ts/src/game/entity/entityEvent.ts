import type { Point } from "../../common/point.js";
import type { Components } from "../component/component.js";
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
export type EntityEventType = {
    [K in EntityEventId]: FindEventById<K>;
};

export type EntityTransformEvent = {
    id: "transform";
    source: Entity;
    oldPosition: Point;
};

export type EntityChildrenUpdatedEvent = {
    id: "child_added" | "child_removed";
    source: Entity;
    target: Entity;
};

export type ComponentsUpdatedEvent = {
    id:
        | typeof componentAddedId
        | typeof componentRemovedId
        | typeof componentUpdatedId;
    source: Entity;
    item: Components;
};

/**
 * The id of the ComponentsUpdatedEvent when a component has been added to an entity
 */
const componentAddedId = "component_added";
/**
 * The id of the ComponentsUpdatedEvent when a component has been removed from an entity
 */
const componentRemovedId = "component_removed";
/**
 * The id of the ComponentsUpdatedEvent when a component has been updated. This
 * is triggered manually with the invalidateComponent method on an entity
 */
const componentUpdatedId = "component_updated";
