import { describe, it } from "node:test";
import assert from "node:assert";
import { EcsWorld } from "../../src/common/ecs/ecsWorld.ts";
import { pointEquals } from "../../src/common/point.ts";
import { worldGenerationSystem } from "../../src/game/system/worldGenerationSystem.ts";
import { chunkMapSystem } from "../../src/game/system/chunkMapSystem.ts";
import { createRootEntity } from "../../src/game/rootFactory.ts";
import { createMessageEmitterComponent } from "../../src/game/component/messageEmitterComponent.ts";
import { GoblinCampComponentId } from "../../src/game/component/goblinCampComponent.ts";
import { TileComponentId } from "../../src/game/component/tileComponent.ts";
import { getChunkPosition } from "../../src/game/map/chunk.ts";
import { Entity } from "../../src/game/entity/entity.ts";
import { buildWorldStateMessage } from "../../src/server/replicatedEntitiesSystem.ts";
import { handleGameMessage } from "../../src/server/message/gameMessageHandler.ts";
import { applyDiscoveredTiles } from "../../src/server/message/applyDiscoveredTiles.ts";
import { DiscoverTileGameMessageType } from "../../src/server/message/gameMessage.ts";
import {
    createVisibilityMapComponent,
    VisibilityMapComponentId,
} from "../../src/game/component/visibilityMapComponent.ts";
import { createTileComponent } from "../../src/game/component/tileComponent.ts";
import { ChunkSize } from "../../src/game/map/chunk.ts";
import { makeNumberId } from "../../src/common/point.ts";
import type { Volume } from "../../src/game/map/volume.ts";
import type { DiscoveredTileData } from "../../src/server/message/playerDiscoveryData.ts";

function setupServerWorld(): Entity {
    const root = createRootEntity();
    root.setEcsComponent(createMessageEmitterComponent(() => {}));
    const ecsWorld = new EcsWorld(root);
    ecsWorld.addSystem(chunkMapSystem);
    ecsWorld.addSystem(worldGenerationSystem);
    ecsWorld.runInit();
    return root;
}

describe("world state replication", () => {
    it("includes all generated chunks, not just discovered ones", () => {
        const root = setupServerWorld();
        const message = buildWorldStateMessage(root, "player", 0);

        assert.strictEqual(message.chunks.length, 10);
        for (const chunk of message.chunks) {
            assert.ok(
                message.volumes.some((volume) => volume.id === chunk.volume),
                `volume ${chunk.volume} for chunk (${chunk.chunkX},${chunk.chunkY}) is missing from the message`,
            );
        }

        // The camp chunk starts undiscovered but its ground must still be
        // replicated — its entities are
        const camps = root.queryComponents(GoblinCampComponentId);
        const campEntity = [...camps.keys()][0];
        const campChunk = getChunkPosition(
            campEntity.worldPosition.x,
            campEntity.worldPosition.y,
        );
        assert.ok(
            message.chunks.some(
                (chunk) =>
                    chunk.chunkX === campChunk.x &&
                    chunk.chunkY === campChunk.y,
            ),
            "expected the camp chunk to be replicated",
        );
        assert.ok(
            !message.discoveredTiles.some((tile) =>
                pointEquals(getChunkPosition(tile.x, tile.y), campChunk),
            ),
            "expected the camp chunk to start undiscovered",
        );
    });

    it("registers replicated chunks in the client tile component", () => {
        const root = setupServerWorld();
        const message = buildWorldStateMessage(root, "player", 0);

        const clientRoot = new Entity("client-root");
        handleGameMessage(clientRoot, message);

        const clientTiles = clientRoot.requireEcsComponent(TileComponentId);
        assert.strictEqual(clientTiles.chunks.size, 10);
        for (const chunk of clientTiles.chunks.values()) {
            assert.ok(
                chunk.volume,
                `client chunk (${chunk.chunkX},${chunk.chunkY}) has no volume`,
            );
        }
    });

    it("keeps the volume instance chunks reference when a discover message resends it", () => {
        const root = setupServerWorld();
        const clientRoot = new Entity("client-root");
        handleGameMessage(clientRoot, buildWorldStateMessage(root, "player", 0));

        // The camp chunk is replicated but undiscovered; discovering a tile
        // in it later resends its volume as a fresh object instance
        const camps = root.queryComponents(GoblinCampComponentId);
        const campEntity = [...camps.keys()][0];
        const campChunk = getChunkPosition(
            campEntity.worldPosition.x,
            campEntity.worldPosition.y,
        );
        const clientTiles = clientRoot.requireEcsComponent(TileComponentId);
        const clientCampChunk = [...clientTiles.chunks.values()].find(
            (chunk) =>
                chunk.chunkX === campChunk.x && chunk.chunkY === campChunk.y,
        );
        assert.ok(clientCampChunk?.volume);
        const registeredVolume = clientCampChunk.volume;

        handleGameMessage(clientRoot, {
            type: DiscoverTileGameMessageType,
            tiles: [
                {
                    x: campChunk.x * ChunkSize,
                    y: campChunk.y * ChunkSize,
                    volume: registeredVolume.id,
                },
            ],
            volumes: [structuredClone(registeredVolume)],
        });

        assert.strictEqual(clientTiles.chunks.size, 10);
        assert.strictEqual(
            clientTiles.volume.get(registeredVolume.id),
            registeredVolume,
            "expected the discover message to keep the registered volume instance",
        );
        const visibilityMap = clientRoot.requireEcsComponent(
            VisibilityMapComponentId,
        );
        const partialChunk =
            visibilityMap.discovered.partiallyDiscoveredChunks.get(
                makeNumberId(campChunk.x, campChunk.y),
            );
        assert.ok(partialChunk?.has(makeNumberId(0, 0)));
    });

    it("ignores duplicate tiles for fully discovered chunks", () => {
        const tileComponent = createTileComponent();
        const visibilityMap = createVisibilityMapComponent();
        const volume: Volume = {
            id: "vol1",
            maxSize: 4,
            chunks: [],
            type: "forrest",
            debugColor: "#fff",
        };

        const allTiles: DiscoveredTileData[] = [];
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                allTiles.push({ x, y, volume: volume.id });
            }
        }
        applyDiscoveredTiles(tileComponent, visibilityMap, allTiles, [volume]);

        const chunkId = makeNumberId(0, 0);
        assert.ok(visibilityMap.discovered.fullyDiscoveredChunks.has(chunkId));
        assert.ok(
            !visibilityMap.discovered.partiallyDiscoveredChunks.has(chunkId),
        );

        // A duplicate tile must not recreate partial discovery data next to
        // the fully discovered flag
        applyDiscoveredTiles(
            tileComponent,
            visibilityMap,
            [{ x: 1, y: 1, volume: volume.id }],
            [],
        );

        assert.ok(visibilityMap.discovered.fullyDiscoveredChunks.has(chunkId));
        assert.ok(
            !visibilityMap.discovered.partiallyDiscoveredChunks.has(chunkId),
        );
    });
});
