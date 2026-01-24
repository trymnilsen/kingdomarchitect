import { Entity } from "../../game/entity/entity.ts";
import type { Camera } from "../../rendering/camera.ts";
import { effectHandler } from "./effect/effectHandler.ts";
import {
    AddEntityGameMessageType,
    EffectGameMessageType,
    RemoveEntityGameMessageType,
    SetComponentGameMessageType,
    TransformGameMessageType,
    type AddEntityGameMessage,
    type EffectGameMessage,
    type ReplicatedEntityData,
    type GameMessage,
    type RemoveEntityGameMessage,
    type SetComponentGameMessage,
    type TransformGameMessage,
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
