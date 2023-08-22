import { componentLoaders } from "../game/component/componentLoader.js";
import { Entity } from "../game/entity/entity.js";

export class EntityPersister {
    persist(world: Entity): BundleSet[] {
        // loop over the children and persist them
        const children = [world];
        const bundleSet: BundleSet[] = [];
        while (children.length > 0) {
            const entity = children.pop()!;
            const componentIds: string[] = [];
            const componentBundles: ComponentPersistenceBundle[] = [];
            // Persist any components of this entity
            for (const component of entity.components) {
                const type = Object.getPrototypeOf(component).constructor.name;
                const id = entity.id + "-" + type;
                componentIds.push(id);
                const data = component.toComponentBundle();
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

    load(bundleSets: BundleSet[]): Entity {
        const componentPersistenceBundles: ComponentPersistenceBundle[] = [];
        const entitiesForChildMap: { [id: string]: Entity } = {};
        const entitiesById: { [id: string]: Entity } = {};
        const entityChildren: { [id: string]: string[] } = {};

        //Loop over and sort out components and create the entities
        for (const bundleSet of bundleSets) {
            componentPersistenceBundles.push(...bundleSet.components);
            const entity = new Entity(bundleSet.entity.id);
            entity.worldPosition = {
                x: bundleSet.entity.x,
                y: bundleSet.entity.y,
            };
            entitiesForChildMap[entity.id] = entity;
            entitiesById[entity.id] = entity;
            entityChildren[entity.id] = bundleSet.entity.children;
        }
        //Loop over and assign children
        for (const entity of Object.values(entitiesById)) {
            const children = entityChildren[entity.id];
            for (const child of children) {
                const childEntity = entitiesForChildMap[child];
                if (!childEntity) {
                    throw new Error(`Child with id ${child} not found`);
                }
                entity.addChild(childEntity);
                delete entitiesForChildMap[child];
            }
        }
        //Find the root node, the one without a parent
        const rootNodes = Object.values(entitiesById).filter(
            (entity) => !entity.parent
        );

        if (rootNodes.length == 0) {
            throw new Error("No root node found");
        }

        if (rootNodes.length > 1) {
            throw new Error("More than one entity without a parent found");
        }

        const rootNode = rootNodes[0];

        //Loop over and create components
        for (const persistedComponent of componentPersistenceBundles) {
            const type = persistedComponent.type;
            const constructorFn = componentLoaders.find(
                (fn) => fn.name == type
            );
            if (!constructorFn) {
                throw new Error(
                    `No constructor function found for component, ${constructorFn}`
                );
            }

            const owningEntity = entitiesById[persistedComponent.entityId];
            if (!owningEntity) {
                throw new Error(
                    `No entity with id ${persistedComponent.entityId} for component ${persistedComponent.componentId}`
                );
            }

            const component = new constructorFn();
            owningEntity.addComponent(component);
            component.fromComponentBundle(persistedComponent.data);
        }

        rootNode.toggleIsGameRoot(true);
        return rootNode;
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
