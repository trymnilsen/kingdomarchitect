import { Entity } from "../../game/entity/entity.js";
import { EntityEvent, EntityEventMap } from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import type { EcsWorld } from "./ecsWorld.js";

export type EcsRenderFunction = (
    world: EcsWorld,
    renderScope: RenderScope,
    visibilityMap: RenderVisibilityMap,
    drawMode: DrawMode,
) => void;

export type EcsUpdateFunction = (world: EcsWorld, updateTime: number) => void;

export type EcsEntityEventFunction<T extends EntityEvent> = (
    world: EcsWorld,
    event: T,
) => void;

export type EcsInitFunction = (rootEntity: Entity) => void;

type EcsComponent = {
    constructor: Function;
};

export type EcsEntityEvents = Partial<{
    [k in EntityEvent["id"]]: EcsEntityEventFunction<EntityEventMap[k]>;
}>;

export interface EcsSystem {
    onRender?: EcsRenderFunction;
    onUpdate?: EcsUpdateFunction;
    onInit?: EcsInitFunction;
    onEntityEvent?: EcsEntityEvents;
}
