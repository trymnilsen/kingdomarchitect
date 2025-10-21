import { Entity } from "../../game/entity/entity.js";
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

export function handleGameMessage(root: Entity, message: GameMessage) {
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
            effectHandler(root, message);
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

    const newEntity = new Entity(message.id);
    parent.addChild(newEntity);
    newEntity.worldPosition = message.position;
    for (const component of message.components) {
        newEntity.setEcsComponent(component);
    }

    // Recursively add children
    if (message.children && message.children.length > 0) {
        addChildren(newEntity, message.children);
    }
}

/**
 * Recursively add children to an entity
 */
function addChildren(parent: Entity, children: ReplicatedEntityData[]) {
    for (const childData of children) {
        const childEntity = new Entity(childData.id);
        parent.addChild(childEntity);
        childEntity.worldPosition = childData.position;

        // Add components to child
        for (const component of childData.components) {
            childEntity.setEcsComponent(component);
        }

        // Recursively add nested children
        if (childData.children && childData.children.length > 0) {
            addChildren(childEntity, childData.children);
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
    }
}

function transformHandler(root: Entity, message: TransformGameMessage) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.worldPosition = message.position;
    }
}
