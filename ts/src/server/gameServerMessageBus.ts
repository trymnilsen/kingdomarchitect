import type { Point } from "../common/point.js";
import type { ComponentType } from "../game/component/component.js";
import type { EntityAction } from "../module/action/entityAction.js";
import type { BiomeType } from "../module/map/biome.js";
import type { Volume } from "../module/map/volume.js";

export interface GameServerMessageBus {
    postMessage(message: GameServerMessageEntry);
}

export type GameServerMessage = {
    entries: GameServerMessageEntry[];
};

export type GameServerMessageEntry =
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
    components: { id: string; data: ComponentType }[];
};

export type AddComponentMessage = {
    id: "addComponent";
    component: ComponentType;
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
