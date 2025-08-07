import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { addInitialPlayerChunk } from "../map/player.js";
import type { Entity } from "../entity/entity.js";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.js";
import {
    discoverTile,
    WorldDiscoveryComponentId,
} from "../component/worldDiscoveryComponent.js";
import {
    diamondPattern,
    generateDiamondPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.js";
import type { DiscoverTileEffect } from "../../server/message/effect/discoverTileEffect.js";
import { TileComponentId } from "../component/tileComponent.js";
import type { Point } from "../../common/point.js";
import { getChunkPosition } from "../map/chunk.js";

export const worldGenerationSystem: EcsSystem = {
    onInit,
};

function onInit(root: Entity) {
    //TODO: Should send a set ChunkEvent
    const start = addInitialPlayerChunk(root);
    //Discover the tiles for the player, we should make this more dynamic
    const worldDiscovery = root.getEcsComponent(WorldDiscoveryComponentId);
    const pattern = offsetPatternWithPoint(start, generateDiamondPattern(5));
    setDiscoveryForPlayer(root, "player", pattern);
}

export function setDiscoveryForPlayer(
    root: Entity,
    player: string,
    discoveredPoints: Point[],
) {
    const effectEmitter = root.requireEcsComponent(EffectEmitterComponentId);
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const firstChunk = Array.from(tileComponent.chunks.values())[0];
    const volume = firstChunk.volume;
    if (!volume) {
        throw new Error("No volume, probably not implemented yet");
    }

    const effect: DiscoverTileEffect = {
        id: "discoverTile",
        tiles: discoveredPoints.map((point) => {
            return { ...point, volume: volume.id };
        }),
        volumes: [volume],
    };

    root.updateComponent(WorldDiscoveryComponentId, (component) => {
        for (const point of discoveredPoints) {
            discoverTile(component, player, point);
        }
    });

    effectEmitter.emitter(effect);
}
