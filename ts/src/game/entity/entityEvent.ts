import type { Point } from "../../common/point.ts";
import type { ComponentID, Components } from "../component/component.ts";
import { Entity } from "./entity.ts";
import type { EntityGameEvent } from "./event/entityGameEvent.ts";

export type EntityEvent =
    | EntityTransformEvent
    | EntityChildrenUpdatedEvent
    | ComponentsUpdatedEvent
    | EntityGameEvent;

export type EntityEventId = EntityEvent["id"];

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

export type ComponentsUpdatedEvent<ID extends ComponentID = ComponentID> = {
    id: typeof componentRemovedId | typeof componentUpdatedId;
    source: Entity;
    item: Extract<Components, { id: ID }>;
    /**
     * The previous value of the component before the update.
     * Only present for component_updated events when using updateComponent().
     */
    oldValue?: Extract<Components, { id: ID }>;
};

const componentRemovedId = "component_removed";
const componentUpdatedId = "component_updated";
