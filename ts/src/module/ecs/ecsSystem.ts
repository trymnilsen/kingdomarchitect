import { Entity } from "../../game/entity/entity.js";
import { EntityEvent, EntityEventMap } from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";

export type EcsRenderFunction = (
    rootEntity: Entity,
    renderScope: RenderScope,
    visibilityMap: RenderVisibilityMap,
    drawMode: DrawMode,
) => void;

export type EcsUpdateFunction = (
    rootEntity: Entity,
    updateTime: number,
) => void;

export type EcsEntityEventFunction<T extends EntityEvent> = (
    rootEntity: Entity,
    event: T,
) => void;

export type EcsInitFunction = (rootEntity: Entity) => void;

type Foo = Record<string, any>;
type String1 = "hello" | "hi";
type String2 = "heya" | "greetings";
type AllStrings = String1 | String2;

type EcsComponent = {
    constructor: Function;
};

class Foobar {
    hello?: string;
}

const bar: EcsComponent = new Foobar();

export type EcsEntityEvents = Partial<{
    [k in EntityEvent["id"]]: EcsEntityEventFunction<EntityEventMap[k]>;
}>;

export interface EcsSystem {
    onRender?: EcsRenderFunction;
    onUpdate?: EcsUpdateFunction;
    onInit?: EcsInitFunction;
    onEntityEvent?: EcsEntityEvents;
}
