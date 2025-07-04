import type { Point } from "../common/point.js";
import type { Components } from "../game/component/component.js";
import type { EntityAction } from "../module/action/entityAction.js";

export interface GameServerMessageBus {
    postMessage(message: GameServerMessageEntry);
}

export type GameServerMessage = {
    entries: GameServerMessageEntry[];
};

export type GameServerMessageEntry =
    | SetComponentMessage
    | AddEntityMessage
    | TransformMessage
    | EntityActionMessage;

export type AddEntityMessage = {
    id: "addEntity";
    entity: {
        id: string;
        position: Point;
        parent?: string;
    };
    components: readonly Components[];
};

export type SetComponentMessage = {
    id: "setComponent";
    component: Components;
    entity: string;
};

export type TransformMessage = {
    id: "transform";
    entityId: string;
    position: Point;
};

export type EntityActionMessage = {
    id: "entityAction";
    entityAction: EntityAction;
};
