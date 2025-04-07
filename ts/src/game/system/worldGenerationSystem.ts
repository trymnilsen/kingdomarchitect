import type { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { addInitialPlayerChunk } from "../../module/map/player.js";
import type { Entity } from "../entity/entity.js";

export const WorldGenerationSystem: EcsSystem = {
    onInit,
};

function onInit(root: Entity) {
    addInitialPlayerChunk(root);
}
