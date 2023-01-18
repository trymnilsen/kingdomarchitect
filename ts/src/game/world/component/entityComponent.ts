import { BaseEvent } from "../../../common/event/baseEvent";
import { Point } from "../../../common/point";
import { RenderContext } from "../../../rendering/renderContext";
import { Entity } from "../entity/entity";
import { ComponentEvent } from "./componentEvent";

export abstract class EntityComponent {
    private _entity?: Entity;

    public get entity(): Entity | undefined {
        return this._entity;
    }

    public set entity(value: Entity | undefined) {
        this._entity = value;
    }

    protected publishEvent(event: ComponentEvent<EntityComponent>) {
        if (!!this._entity) {
            this._entity.componentEvents.publish(event);
        } else {
            console.warn("No entity set, event is not published", this, event);
        }
    }

    /**
     * Called when the component is started, this is either
     * when its added to an entity that is attached or when the entity
     * the component is added on is added to an entity that is attached
     *
     * __Note:__ Remember to call `super` if this method is overiden to
     * let
     * @param tick
     */
    onStart(tick: number) {}
    /**
     * Called when the component is either removed from an entity or when
     * an entity this component is added to is removed from the entity-tree.
     *
     * __Note:__ Remember to call `super` if this method is overriden to allow
     * cleanup of underlying items
     */
    onStop(tick: number) {}
    onUpdate(tick: number) {}
    onDraw(context: RenderContext, screenPosition: Point) {}
}
