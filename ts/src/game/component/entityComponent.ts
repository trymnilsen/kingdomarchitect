import { JSONValue } from "../../common/object.js";
import { Point } from "../../common/point.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import { Entity } from "../entity/entity.js";
import { ComponentEvent } from "./componentEvent.js";

export abstract class EntityComponent {
    private _entity?: Entity;

    get entity(): Entity {
        if (!this._entity) {
            throw new Error("No entity available for component");
        }

        return this._entity;
    }

    set entity(value: Entity) {
        this._entity = value;
    }

    /**
     * Called when the component is started, this is either
     * when its added to an entity that is attached or when the entity
     * the component is added on is added to an entity that is attached.
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
    onDraw(
        _context: RenderScope,
        _screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
    ) {}

    protected publishEvent(event: ComponentEvent<EntityComponent>) {
        if (this._entity) {
            this._entity.componentEvents.publish(event);
        } else {
            console.warn("No entity set, event is not published", this, event);
        }
    }
}

export function assertEntityComponent<T extends EntityComponent>(
    component: T | null,
): asserts component is T {
    if (!component) {
        throw new Error("Entity has not been resolved from id");
    }
}
