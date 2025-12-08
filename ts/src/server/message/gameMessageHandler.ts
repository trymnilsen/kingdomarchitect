import { Entity } from "../../game/entity/entity.js";
import type { Camera } from "../../rendering/camera.js";
import { effectHandler } from "./effect/effectHandler.js";
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
} from "./gameMessage.js";

export function handleGameMessage(
    root: Entity,
    camera: Camera,
    message: GameMessage,
) {
    console.log("[HandleGameMessage] message from server", message);
    switch (message.type) {
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
