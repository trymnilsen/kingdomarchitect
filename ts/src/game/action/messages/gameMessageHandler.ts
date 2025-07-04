import type {
    AddEntityMessage,
    GameServerMessage,
    TransformMessage,
} from "../../../server/gameServerMessageBus.js";
import type { Components } from "../../component/component.js";
import { Entity } from "../../entity/entity.js";

export function handleGameMessage(message: GameServerMessage, root: Entity) {
    for (const entry of message.entries) {
        console.log("Game message: ", entry.id, entry);
        switch (entry.id) {
            case "addEntity":
                createEntity(entry, root);
                break;
            case "transform":
                transformEntity(entry, root);
                break;
            case "setComponent":
                setComponent(root, entry.entity, entry.component);
                break;
            case "entityAction":
                if (root.actionDispatch) {
                    root.actionDispatch(entry.entityAction);
                }
                break;
            default:
                break;
        }
    }
}

function setComponent(root: Entity, entityId: string, component: Components) {
    const entity = root.findEntity(entityId);
    if (!entity) {
        console.warn("Entity not found", entityId);
        return;
    }

    entity.setEcsComponent(component);
}

function createEntity(addEntityMessage: AddEntityMessage, root: Entity) {
    const newEntity = new Entity(addEntityMessage.entity.id);
    //TODO: Parent should always be set
    if (!addEntityMessage.entity.parent) {
        throw new Error("No parent set");
    }
    const parent = root.findEntity(addEntityMessage.entity.parent);
    if (!parent) {
        throw new Error(
            `No parent with id ${addEntityMessage.entity.parent} found`,
        );
    }
    parent.addChild(newEntity);
    newEntity.worldPosition = addEntityMessage.entity.position;
    for (const component of addEntityMessage.components) {
        newEntity.setEcsComponent(component);
    }
}
function transformEntity(transformMessage: TransformMessage, root: Entity) {
    const entity = root.findEntity(transformMessage.entityId);
    if (!entity) {
        throw new Error(
            `No entity with id ${transformMessage.entityId} exists`,
        );
    }

    entity.worldPosition = transformMessage.position;
}
