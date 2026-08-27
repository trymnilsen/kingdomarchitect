import type { Point } from "../../common/point.ts";
import type { Components } from "../component/component.ts";
import { Entity } from "./entity.ts";
import type { EntityGameEvent } from "./event/entityGameEvent.ts";

export type EntityEvent =
    | EntityTransformEvent
    | EntityChildrenUpdatedEvent
    | ComponentsUpdatedEvent
    | EntityGameEvent;

export type EntityEventId = EntityEvent["id"];

/**
 * The event type carrying a given id. One event type can cover several ids, as
 * ComponentsUpdatedEvent does, so the match is by assignability rather than
 * equality.
 */
type FindEventById<
    Id extends EntityEventId,
    EventUnion = EntityEvent,
> = EventUnion extends { id: infer EventIdType }
    ? Id extends EventIdType
        ? EventUnion
        : never
    : never;

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
    /**
     * The entity that had a child added or removed
     */
    source: Entity;
    /**
     * The entity that was added or removed
     */
    target: Entity;
};

export type ComponentsUpdatedEvent = {
    id:
        | typeof componentAddedId
        | typeof componentRemovedId
        | typeof componentUpdatedId;
    source: Entity;
    item: Components;
    /**
     * The previous value of the component before the update.
     * Only present for component_updated events when using updateComponent().
     * Used for computing delta updates.
     */
    oldValue?: Components;
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
