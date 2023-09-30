import { JSONValue } from "../../common/object.js";
import { Point } from "../../common/point.js";
import { RenderContext } from "../../rendering/renderContext.js";
import { Entity } from "../entity/entity.js";
import { ComponentEvent } from "./componentEvent.js";

export abstract class EntityComponent<
    PersistedDataType extends JSONValue = JSONValue,
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
    onStart(_tick: number) {}
    /**
     * Called when the component is either removed from an entity or when
     * an entity this component is added to is removed from the entity-tree.
     *
     */
    onStop(_tick: number) {}
    onUpdate(_tick: number) {}
    onDraw(_context: RenderContext, _screenPosition: Point) {}

    /**
     * Invoked when component is restored from a save. The component should
     * reset its state to match the given bundle
     * @param bundle
     */
    abstract fromComponentBundle(bundle: PersistedDataType): void;
    /**
     * Invoked when the component is meant to save its state. The returned
     * bundle will later be used to restore this component fra the savestate
     */
    abstract toComponentBundle(): PersistedDataType;

    protected publishEvent(event: ComponentEvent<EntityComponent>) {
        if (this._entity) {
            this._entity.componentEvents.publish(event);
        } else {
            console.warn("No entity set, event is not published", this, event);
        }
    }
}

/**
 * A component that does not persist any state. This class can be used when
 * the component solely does updating logic and the scaffolding of a to and from
 * bundle implementation is not needed or for cases where component are used as
 * indicators based or their presence or not. Non persisted components still
 * needs to be added to the `ComponentLoader`, they're just not saved with any
 * state.
 */
export class StatelessComponent extends EntityComponent {
    override fromComponentBundle(): void {}
    override toComponentBundle() {
        return {};
    }
}

export function assertEntityComponent<T extends EntityComponent>(
    component: T | null,
): asserts component is T {
    if (!component) {
        throw new Error("Entity has not been resolved from id");
    }
}
