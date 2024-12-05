import { ConstructorFunction } from "../common/constructor.js";

export abstract class EcsComponent {}
export type ComponentFn = ConstructorFunction<EcsComponent>;

/*
export class ComponentRegistry {
    private components: Map<number, Map<Function, object>>;
    private cachedComponents: Map<Function, object[]>;

    constructor() {
        this.components = new Map();
        this.cachedComponents = new Map();
    }

    get<T extends EcsComponent>(componentType: ComponentFn<T>) {
        const cachedEntry = this.cachedComponents.get(componentType);
        if (cachedEntry != undefined) {
            return cachedEntry as T[];
        } else {
            const matchingComponents: EcsComponent[] = [];
            for (const [entity, components] of this.components) {
                const component = components.get(componentType);
                if (component != undefined) {
                    matchingComponents.push(component);
                }
            }

            this.cachedComponents.set(componentType, matchingComponents);
            return matchingComponents as T[];
        }
    }

    add(entity: EcsEntity, component: EcsComponent) {
        if (!this.components.has(entity)) {
            this.components.set(entity, new Map());
        }
        this.components.get(entity)!.set(component.constructor, component);
    }
}
*/
