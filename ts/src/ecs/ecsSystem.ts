import { ConstructorFunction } from "../common/constructor.js";
import { ReadableSet, SparseSet } from "../common/structure/sparseSet.js";
import { RenderScope } from "../rendering/renderScope.js";
import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsEvent, EcsEventFn } from "./ecsEvent.js";
import { EcsWorldScope } from "./ecsWorldScope.js";

export type EcsEntity = number;
export type QueryData<T extends QueryObject = QueryObject> = {
    [P in keyof T]: InstanceType<T[P]>;
};
/*
export type ArrayQueryData<T extends QueryObject = QueryObject> =
    QueryDataObject<T>[];
export type MutableQueryData<T extends QueryObject = QueryObject> = SparseSet<
    QueryDataObject<T>
>;
export type QueryData<T extends QueryObject = QueryObject> = ReadableSet<
    QueryDataObject<T>
>;*/

export interface QueryObject<T extends ComponentFn = ComponentFn> {
    [componentName: string]: T;
}

export interface EcsSystem {
    hasEvent(event: EcsEvent): boolean;
    onEvent(
        query: Iterator<QueryData>,
        event: EcsEvent,
        worldScope: EcsWorldScope,
    ): void;
    readonly query: Readonly<QueryObject>;
}

export type EventFunction<
    T extends QueryObject = QueryObject,
    TData extends EcsEvent = EcsEvent,
> = (query: Iterator<QueryData<T>>, event: TData, world: EcsWorldScope) => void;

export class SystemBuilder<T extends QueryObject = QueryObject> {
    private events: Map<EcsEventFn, EventFunction<T>> = new Map();

    constructor(private queryObject: T) {}
    build(): EcsSystem {
        return new BuiltEcsSystem(
            this.queryObject,
            this.events as ReadonlyMap<
                EcsEventFn,
                EventFunction<QueryObject<ComponentFn>, EcsEvent>
            >,
        );
    }

    onEvent<TEvent extends EcsEvent = EcsEvent>(
        eventType: ConstructorFunction<TEvent>,
        eventFunction: EventFunction<
            T,
            InstanceType<ConstructorFunction<TEvent>>
        >,
    ): SystemBuilder<T> {
        if (this.events.has(eventType)) {
            console.warn(
                `System already has entry for ${eventType.name}, overwriting`,
            );
        }
        this.events.set(eventType, eventFunction as EventFunction);
        return this;
    }
}

export function createSystem<T extends QueryObject>(
    query: T,
): SystemBuilder<T> {
    return new SystemBuilder(query);
}

class BuiltEcsSystem implements EcsSystem {
    constructor(
        readonly query: Readonly<QueryObject<ComponentFn>>,
        readonly events: ReadonlyMap<
            Function,
            EventFunction<QueryObject<ComponentFn>, EcsEvent>
        >,
    ) {}

    hasEvent(event: EcsEvent): boolean {
        const eventType = event.constructor;
        return this.events.has(eventType);
    }

    onEvent(
        query: Iterator<QueryData>,
        event: EcsEvent,
        worldScope: EcsWorldScope,
    ): void {
        const eventType = event.constructor;
        const handler = this.events.get(eventType);
        if (handler) {
            handler(query, event, worldScope);
        } else {
            console.warn(
                `Attempted to handle unknown event ${eventType.name}, something is fishy`,
            );
        }
    }
}
