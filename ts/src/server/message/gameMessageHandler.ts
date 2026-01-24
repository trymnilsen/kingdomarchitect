import { Entity } from "../../game/entity/entity.ts";
import type { Camera } from "../../rendering/camera.ts";
import {
    createTileComponent,
    TileComponentId,
} from "../../game/component/tileComponent.ts";
import { getTileId } from "../../game/map/tile.ts";
import { effectHandler } from "./effect/effectHandler.ts";
import {
    AddEntityGameMessageType,
    EffectGameMessageType,
    RemoveEntityGameMessageType,
    SetComponentGameMessageType,
    TransformGameMessageType,
    type AddEntityGameMessage,
    type ReplicatedEntityData,
    type GameMessage,
    type RemoveEntityGameMessage,
    type SetComponentGameMessage,
    type TransformGameMessage,
    type WorldStateGameMessage,
    WorldStateMessageType,
} from "./gameMessage.ts";

export function handleGameMessage(
    root: Entity,
    camera: Camera,
    message: GameMessage,
) {
    console.log("[HandleGameMessage] message from server", message);
    switch (message.type) {
        case WorldStateMessageType:
            updateWorldState(root, message);
            break;
        case AddEntityGameMessageType:
            addEntityHandler(root, message);
            break;
        case RemoveEntityGameMessageType:
            removeEntityHandler(root, message);
            break;
        case SetComponentGameMessageType:
            setComponentHandler(root, message);
            break;
        case TransformGameMessageType:
            transformHandler(root, message);
            break;
        case EffectGameMessageType:
            effectHandler(root, camera, message);
            break;
        default:
            break;
    }
}

function addEntityHandler(root: Entity, message: AddEntityGameMessage) {
    // Check if entity already exists (e.g., client created it locally)
    const existingEntity = root.findEntity(message.id);
    if (existingEntity) {
        // Entity already exists - merge server data with existing entity
        mergeEntityData(existingEntity, message);
        return;
    }

    let parent = root;
    if (message.parent) {
        const entityWithId = root.findEntity(message.parent);
        if (entityWithId) {
            parent = entityWithId;
        }
    }

    createEntityWithChildren(parent, message);
}

/**
 * Merges server data into an existing entity.
 * Updates position and adds/updates server components while preserving client-only components.
 */
function mergeEntityData(entity: Entity, data: ReplicatedEntityData) {
    // Update position from server
    entity.worldPosition = data.position;

    // Add/update components from server
    // Client-only components (not in the message) are preserved
    for (const component of data.components) {
        entity.setEcsComponent(component);
    }

    // Handle children - merge existing, add new
    if (data.children && data.children.length > 0) {
        for (const childData of data.children) {
            const existingChild = entity.findEntity(childData.id);
            if (existingChild) {
                mergeEntityData(existingChild, childData);
            } else {
                createEntityWithChildren(entity, childData);
            }
        }
    }
}

/**
 * Creates an entity with its components and recursively creates all children
 */
function createEntityWithChildren(parent: Entity, data: ReplicatedEntityData) {
    const entity = new Entity(data.id);

    // Add components
    for (const component of data.components) {
        entity.setEcsComponent(component);
    }

    entity.worldPosition = data.position;
    parent.addChild(entity);

    // Recursively add children
    if (data.children && data.children.length > 0) {
        for (const childData of data.children) {
            createEntityWithChildren(entity, childData);
        }
    }
}

function removeEntityHandler(root: Entity, message: RemoveEntityGameMessage) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.remove();
    }
}

function setComponentHandler(root: Entity, message: SetComponentGameMessage) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.setEcsComponent(message.component);
        entity.invalidateComponent(message.component.id);
    }
}

function transformHandler(root: Entity, message: TransformGameMessage) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.worldPosition = message.position;
    }
}

/**
 * Handles the initial world state message from the server.
 * This populates the entire world including entities, chunks, and volumes.
 */
function updateWorldState(root: Entity, message: WorldStateGameMessage) {
    // Create or get the TileComponent on the root
    let tileComponent = root.getEcsComponent(TileComponentId);
    if (!tileComponent) {
        tileComponent = createTileComponent();
        root.setEcsComponent(tileComponent);
    }

    // Build a volume lookup map
    const volumeMap = new Map<string, (typeof message.volumes)[0]>();
    for (const volume of message.volumes) {
        volumeMap.set(volume.id, volume);
        // Register the volume in the tile component
        tileComponent.volume.set(volume.id, volume);
    }

    // Populate chunks with their volume references
    for (const chunkData of message.chunks) {
        const volume = volumeMap.get(chunkData.volume);
        const chunkId = getTileId(chunkData.x, chunkData.y);

        tileComponent.chunks.set(chunkId, {
            chunkX: chunkData.x,
            chunkY: chunkData.y,
            volume: volume,
        });
    }

    // Create all root children entities recursively
    for (const childData of message.rootChildren) {
        createEntityWithChildren(root, childData);
    }
}
