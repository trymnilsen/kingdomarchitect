import { ConstructorFunction } from "../common/constructor.js";
import { InvalidArgumentError } from "../common/error/invalidArgumentError.js";
import { EntityComponent } from "../game/component/entityComponent.js";

type ComponentPersisterMap = { [id: string]: ComponentPersister };
type ComponentLoaderMap = { [id: string]: ComponentLoader<any> };

export class EntityPersister {
    private _componentPersisterMap: ComponentPersisterMap = {};
    private _componentLoaderMap: ComponentLoaderMap = {};

    registerComponentPersister<T extends EntityComponent>(
        componentType: ConstructorFunction<T>,
        componentPersister: ComponentPersister,
        componentLoader: ComponentLoader<T>
    ) {
        const componentName = componentType.name;
        if (!!this._componentPersisterMap[componentName]) {
            throw new InvalidArgumentError(
                `Persister already added for ${componentName}`
            );
        }

        if (!!this._componentLoaderMap[componentName]) {
            throw new InvalidArgumentError(
                `Loader already added for ${componentName}`
            );
        }

        this._componentPersisterMap[componentName] = componentPersister;
        this._componentLoaderMap[componentName] = componentLoader;
    }

    /*
    persist(world: World): BundleSet[] {
        // loop over the children and persist them
        const children = [world.rootEntity as Entity];
        const bundleSet: BundleSet[] = [];
        while (children.length > 0) {
            const entity = children.pop()!;
            const componentIds: string[] = [];
            const componentBundles: ComponentPersistenceBundle[] = [];
            // Persist any components of this entity
            for (const component of entity.components) {
                const persister = this.getPersister(component);
                if (!persister) {
                    // No persister registered for component
                    throw new Error(`No component persister for ${persister}`);
                }

                const type = Object.getPrototypeOf(component).constructor.name;
                const id = entity.id + "-" + type;
                componentIds.push(id);
                const data = persister();
                const bundle: ComponentPersistenceBundle = {
                    type: type,
                    entityId: entity.id,
                    componentId: id,
                    data: data,
                };

                componentBundles.push(bundle);
            }

            const childrenIds: string[] = [];
            for (const child of entity.children) {
                children.push(child);
                childrenIds.push(child.id);
            }

            const entityBundle: EntityPersistenceBundle = {
                id: entity.id,
                x: entity.worldPosition.x,
                y: entity.worldPosition.y,
                children: childrenIds,
                components: componentIds,
            };

            bundleSet.push({
                components: componentBundles,
                entity: entityBundle,
            });
        }

        return bundleSet;
    }

    load(bundleSet: BundleSet[]): World {
        return new World();
    }*/

    private getPersister(
        component: EntityComponent
    ): ComponentPersister | null {
        const persisterName = Object.getPrototypeOf(component).constructor.name;
        const persister = this._componentPersisterMap[persisterName];
        return persister;
    }
}

export interface ComponentPersistenceBundle {
    entityId: string;
    componentId: string;
    type: string;
    data: {};
}

export interface EntityPersistenceBundle {
    id: string;
    x: number;
    y: number;
    children: string[];
    components: string[];
}

export interface BundleSet {
    components: ComponentPersistenceBundle[];
    entity: EntityPersistenceBundle;
}

export type ComponentPersister = () => {};
export type ComponentLoader<T extends EntityComponent> = (data: {}) => T;
