import type { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { addInitialPlayerChunk } from "../map/player.js";
import type { Entity } from "../entity/entity.js";

export const worldGenerationSystem: EcsSystem = {
    onInit,
};

function onInit(root: Entity) {
    //TODO: Should send a set ChunkEvent
    addInitialPlayerChunk(root);
}
