import { EcsSystem } from "../common/ecs/ecsSystem.js";
import type { Components } from "../game/component/component.js";
import { JobQueueComponentId } from "../game/component/jobQueueComponent.js";
import { TileComponentId } from "../game/component/tileComponent.js";
import { VisibilityMapComponentId } from "../game/component/visibilityMapComponent.js";
import { Entity } from "../game/entity/entity.js";
import type {
    GameMessage,
    ReplicatedEntityData,
} from "./message/gameMessage.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameMessage) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                if (
                    event.source.isGameRoot &&
                    event.item.id != JobQueueComponentId
                ) {
                    return;
                }
                // Don't replicate client-only components
                if (
                    event.item.id === TileComponentId ||
                    event.item.id === VisibilityMapComponentId
                ) {
                    return;
                }
                postMessage({
                    type: "setComponent",
                    component: event.item,
                    entity: event.source.id,
                });
            },
            transform: (_root, event) => {
                postMessage({
                    type: "transform",
                    entity: event.source.id,
                    position: event.source.worldPosition,
                    oldPosition: event.oldPosition,
                });
            },
            child_added: (_root, event) => {
                if (event.target.isGameRoot) {
                    return;
                }

                const children = buildChildrenData(event.target);

                postMessage({
                    type: "addEntity",
                    id: event.target.id,
                    parent: event.target.parent?.id,
                    position: event.target.worldPosition,
                    components: filterClientOnlyComponents(
                        event.target.components,
                    ),
                    children: children.length > 0 ? children : undefined,
                });
            },
            child_removed: (_root, event) => {
                if (event.target.isGameRoot) {
                    return;
                }

                postMessage({
                    type: "removeEntity",
                    entity: event.target.id,
                });
            },
        },
    };
}

/**
 * Recursively build the children data for an entity
 */
function buildChildrenData(entity: Entity): ReplicatedEntityData[] {
    const children: ReplicatedEntityData[] = [];

    for (const child of entity.children) {
        const childData: ReplicatedEntityData = {
            id: child.id,
            parent: child.parent?.id,
            position: child.worldPosition,
            components: filterClientOnlyComponents(child.components),
        };

        // Recursively gather nested children
        const nestedChildren = buildChildrenData(child);
        if (nestedChildren.length > 0) {
            childData.children = nestedChildren;
        }

        children.push(childData);
    }

    return children;
}

/**
 * Filters out client-only components that should not be replicated
 */
function filterClientOnlyComponents(
    components: readonly Components[],
): Components[] {
    return components.filter(
        (component) =>
            component.id !== TileComponentId &&
            component.id !== VisibilityMapComponentId,
    );
}
