import { log } from "../../common/logging/logger.ts";
import { Entity } from "../../game/entity/entity.ts";
import type { Camera } from "../../rendering/camera.ts";

import {
    createTileComponent,
    TileComponentId,
} from "../../game/component/tileComponent.ts";
import {
    createVisibilityMapComponent,
    VisibilityMapComponentId,
} from "../../game/component/visibilityMapComponent.ts";
import { applyGroundUpdate } from "./groundUpdate.ts";
import { applyDelta } from "../delta/applyDelta.ts";
import {
    AddEntityGameMessageType,
    ComponentDeltaGameMessageType,
    GroundUpdateGameMessageType,
    ReloadGameMessageType,
    RemoveComponentGameMessageType,
    RemoveEntityGameMessageType,
    SetComponentGameMessageType,
    TransformGameMessageType,
    type AddEntityGameMessage,
    type ComponentDeltaGameMessage,
    type GroundUpdateGameMessage,
    type ReplicatedEntityData,
    type GameMessage,
    type RemoveComponentGameMessage,
    type RemoveEntityGameMessage,
    type SetComponentGameMessage,
    type TransformGameMessage,
    type WorldStateGameMessage,
    WorldStateMessageType,
} from "./gameMessage.ts";

export function handleGameMessage(root: Entity, message: GameMessage) {
    log.debug("Message from server", { message });
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
        case RemoveComponentGameMessageType:
            removeComponentHandler(root, message);
            break;
        case ComponentDeltaGameMessageType:
            componentDeltaHandler(root, message);
            break;
        case TransformGameMessageType:
            transformHandler(root, message);
            break;
        case GroundUpdateGameMessageType:
            groundUpdateHandler(root, message);
            break;
        case ReloadGameMessageType:
            window.location.reload();
            break;
        default:
            break;
    }
}

function addEntityHandler(root: Entity, message: AddEntityGameMessage) {
    // The client may have created this entity locally already.
    const existingEntity = root.findEntity(message.id);
    if (existingEntity) {
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
    entity.worldPosition = data.position;

    // Components absent from the message are client-only and survive the merge.
    for (const component of data.components) {
        entity.setEcsComponent(component);
    }

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

    for (const component of data.components) {
        entity.setEcsComponent(component);
    }

    // addChild first so worldPosition setter can convert to local space
    parent.addChild(entity);
    entity.worldPosition = data.position;

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

function removeComponentHandler(
    root: Entity,
    message: RemoveComponentGameMessage,
) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.removeEcsComponent(message.componentId);
    }
}

function componentDeltaHandler(
    root: Entity,
    message: ComponentDeltaGameMessage,
) {
    const entity = root.findEntity(message.entityId);
    if (!entity) {
        return;
    }

    const component = entity.getEcsComponent(message.componentId);
    if (!component) {
        return;
    }

    applyDelta(component, message.operations);
}

function transformHandler(root: Entity, message: TransformGameMessage) {
    const entity = root.findEntity(message.entity);
    if (entity) {
        entity.worldPosition = message.position;
    }
}

function groundUpdateHandler(root: Entity, message: GroundUpdateGameMessage) {
    applyGroundUpdate(
        root.requireEcsComponent(TileComponentId),
        root.requireEcsComponent(VisibilityMapComponentId),
        message.ground,
    );
}

/**
 * Handles the initial world state message from the server.
 * This populates the entire world including entities, discovered tiles, and volumes.
 */
function updateWorldState(root: Entity, message: WorldStateGameMessage) {
    let tileComponent = root.getEcsComponent(TileComponentId);
    if (!tileComponent) {
        tileComponent = createTileComponent();
        root.setEcsComponent(tileComponent);
    }

    let visibilityMapComponent = root.getEcsComponent(VisibilityMapComponentId);
    if (!visibilityMapComponent) {
        visibilityMapComponent = createVisibilityMapComponent();
        root.setEcsComponent(visibilityMapComponent);
    }

    applyGroundUpdate(tileComponent, visibilityMapComponent, message.ground);

    for (const comp of message.replicatedRootComponents) {
        root.setEcsComponent(comp);
    }

    for (const childData of message.rootChildren) {
        createEntityWithChildren(root, childData);
    }
}
