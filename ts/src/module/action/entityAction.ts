import type { EntityId } from "../ecs/ecsEntity.js";

export type EntityAction = {
    id: [EntityActionCategory, string];
};

export type EntityActionCategory = "world";
