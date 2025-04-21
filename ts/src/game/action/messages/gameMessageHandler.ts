import type { ActionDispatcher } from "../../../module/action/actionDispatcher.js";
import type {
    AddEntityMessage,
    GameServerMessage,
    TransformMessage,
} from "../../../server/gameServerMessageBus.js";
import { ChunkMapComponent } from "../../component/chunkMapComponent.js";
import type { ComponentType } from "../../component/component.js";
import { InventoryComponent } from "../../component/inventoryComponent.js";
import { JobRunnerComponent } from "../../component/jobRunnerComponent.js";
import { PlayerUnitComponent } from "../../component/playerUnitComponent.js";
import { ResourceComponent } from "../../component/resourceComponent.js";
import { SpriteComponent } from "../../component/spriteComponent.js";
import { TileComponent } from "../../component/tileComponent.js";
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
        const componentInstance = buildComponent(component.id, component.data);
        newEntity.addEcsComponent(componentInstance);
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
function buildComponent(id: string, data: ComponentType): ComponentType {
    const component = componentFactory[id];
    if (!component) {
        throw new Error(`no component factory for ${id}`);
    }
    const componentInstance = component();
    const withData = Object.assign(componentInstance, data);
    return withData;
}

const componentFactory = {
    [JobRunnerComponent.name]: () => new JobRunnerComponent(),
    [SpriteComponent.name]: () => new SpriteComponent(),
    [InventoryComponent.name]: () => new InventoryComponent(),
    [ResourceComponent.name]: () => new ResourceComponent(),
    [PlayerUnitComponent.name]: () => new PlayerUnitComponent(),
};
