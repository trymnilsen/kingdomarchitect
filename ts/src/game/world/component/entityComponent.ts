import { Lifecycle } from "../../../common/event/lifecycle.js";
import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../entity/entity.js";
import { ComponentEvent } from "./componentEvent.js";

export abstract class EntityComponent<
    PersistedDataType extends JSONValue = {}
> {
    private _entity?: Entity;

    public get entity(): Entity {
        if (!this._entity) {
            throw new Error("No entity available for component");
        }

        return this._entity;
    }

    public set entity(value: Entity) {
        this._entity = value;
    }

    /**
     * Called when the component is started, this is either
     * when its added to an entity that is attached or when the entity
     * the component is added on is added to an entity that is attached.
     * The entity tree is guaranteed to be built from save-data if any
     * at this point
     * @param tick
     */
    onStart(tick: number) {}
    /**
     * Called when the component is either removed from an entity or when
     * an entity this component is added to is removed from the entity-tree.
     *
     */
    onStop(tick: number) {}
    onUpdate(tick: number) {}
    onDraw(context: RenderContext, screenPosition: Point) {}

    /**
     * Invoked when the the game is saved and this component should create
     * an object/map that can be serialized and stored in save data.
     * Defaults to returning an empty object, override to provide an object of
     * the `PersistedDataType` type
     */
    onPersist(): PersistedDataType {
        return <PersistedDataType>{};
    }

    protected publishEvent(event: ComponentEvent<EntityComponent>) {
        if (!!this._entity) {
            this._entity.componentEvents.publish(event);
        } else {
            console.warn("No entity set, event is not published", this, event);
        }
    }
}

/**
 * Represents a function used to create components, will provided the id of the
 * component that it was saved with)
 */
export type ComponentFactory<T extends JSONValue = {}> = (
    data: T
) => EntityComponent;

export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;
