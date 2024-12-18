import { ConstructorFunction } from "../common/constructor.js";
import { EcsEntity } from "./ecsEntity.js";

export abstract class EcsComponent {
    /**
     * The entity this component is attached to. Can be undefined if it is not
     * attached to any or the entity it was attached to has been destroyed
     */
    public entity?: EcsEntity;
}
export type ComponentFn<T extends EcsComponent = EcsComponent> =
    ConstructorFunction<T>;

/**
 * Retrieves the entity for the component using the entity field.
 * Will throw if this is not set
 * @throws if the entity is undefined
 * @param component the component to get the entity for
 * @returns the entity number for the component
 */
export function entityOf(component: EcsComponent): EcsEntity {
    if (!!component.entity) {
        return component.entity;
    } else {
        throw new Error(
            `No entity for component ${component.constructor.name}`,
        );
    }
}
