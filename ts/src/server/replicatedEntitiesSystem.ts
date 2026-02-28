import type { EcsSystem } from "../common/ecs/ecsSystem.ts";
import type { Components } from "../game/component/component.ts";
import { TileComponentId } from "../game/component/tileComponent.ts";
import { VisibilityMapComponentId } from "../game/component/visibilityMapComponent.ts";
import { WorldDiscoveryComponentId } from "../game/component/worldDiscoveryComponent.ts";
import { Entity } from "../game/entity/entity.ts";
import { diffComponents, isDeltaSmaller } from "./delta/diffComponent.ts";
import {
    WorldStateMessageType,
    type GameMessage,
    type ReplicatedEntityData,
    type WorldStateGameMessage,
} from "./message/gameMessage.ts";
import { getPlayerDiscoveryData } from "./message/playerDiscoveryData.ts";

/**
 * Server-side system that listens for entity tree mutations and forwards
 * them to the client via postMessage. This is the bridge between the
 * simulation (which mutates entities freely) and the client (which needs
 * to mirror that state).
 *
 * For component updates, it attempts to send a delta (only the changed
 * fields) instead of the full component. The old value comes from
 * Entity.updateComponent which snapshots the component via structuredClone
 * before the mutation callback runs. If no snapshot is available (e.g.
 * setEcsComponent was called directly), it falls back to sending the full
 * component.
 */
export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameMessage) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                // The game root holds world-level components (tiles,
                // discovery, visibility). These are managed separately via
                // WorldStateGameMessage or are client-only — none need
                // per-component delta replication.
                if (event.source.isGameRoot) {
                    return;
                }
                // Tiles and visibility maps are client-only components
                // synthesized from discovery data, not replicated per-tick
                if (
                    event.item.id === TileComponentId ||
                    event.item.id === VisibilityMapComponentId
                ) {
                    return;
                }

                // oldValue is the pre-mutation snapshot from updateComponent.
                // When present, we can diff against it to send only changes.
                if (event.oldValue) {
                    const snapshot = event.oldValue;
                    const operations = diffComponents(snapshot, event.item);
                    if (
                        operations.length > 0 &&
                        isDeltaSmaller(operations, event.item)
                    ) {
                        postMessage({
                            type: "componentDelta",
                            entityId: event.source.id,
                            componentId: event.item.id,
                            operations,
                        });
                        return;
                    }
                }

                // Fallback to full component
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
    player: string,
): WorldStateGameMessage {
    // Build replicated data for all root children
    const rootChildren = buildChildrenData(rootEntity);

    // Extract discovered tiles for this player
    const tileComponent = rootEntity.requireEcsComponent(TileComponentId);
    const discoveryComponent = rootEntity.requireEcsComponent(
        WorldDiscoveryComponentId,
    );

    const playerDiscovery = discoveryComponent.discoveriesByUser.get(player);
    const discoveryData =
        playerDiscovery &&
        getPlayerDiscoveryData(tileComponent, playerDiscovery);

    return {
        type: WorldStateMessageType,
        rootChildren,
        discoveredTiles: discoveryData?.tiles ?? [],
        volumes: discoveryData?.volumes ?? [],
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
