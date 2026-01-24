import { EcsSystem } from "../common/ecs/ecsSystem.ts";
import type { Components } from "../game/component/component.ts";
import { JobQueueComponentId } from "../game/component/jobQueueComponent.ts";
import { TileComponentId } from "../game/component/tileComponent.ts";
import { VisibilityMapComponentId } from "../game/component/visibilityMapComponent.ts";
import { Entity } from "../game/entity/entity.ts";
import type { Volume } from "../game/map/volume.ts";
import {
    WorldStateMessageType,
    type GameMessage,
    type ReplicatedEntityData,
    type WorldStateGameMessage,
} from "./message/gameMessage.ts";

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

export function buildWorldStateMessage(
    rootEntity: Entity,
): WorldStateGameMessage {
    // Build replicated data for all root children
    const rootChildren = buildChildrenData(rootEntity);

    // Extract chunks and volumes from the TileComponent
    const tileComponent = rootEntity.requireEcsComponent(TileComponentId);

    const chunks: WorldStateGameMessage["chunks"] = [];
    const volumes: Volume[] = [];

    // Collect all chunks with their volume references
    for (const [_id, chunk] of tileComponent.chunks) {
        if (!chunk.volume) {
            continue;
        }

        chunks.push({
            x: chunk.chunkX,
            y: chunk.chunkY,
            volume: chunk.volume.id,
        });
    }

    // Collect all unique volumes
    for (const [_id, volume] of tileComponent.volume) {
        volumes.push(volume);
    }

    return {
        type: WorldStateMessageType,
        rootChildren,
        chunks,
        volumes,
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
