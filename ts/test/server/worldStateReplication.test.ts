import { describe, it } from "node:test";
import assert from "node:assert";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";
import { encodePosition, pointEquals } from "../../src/common/point.ts";
import {
    setDiscoveryForPlayer,
    worldGenerationSystem,
} from "../../src/game/system/worldGenerationSystem.ts";
import { chunkMapSystem } from "../../src/game/system/chunkMapSystem.ts";
import { createRootEntity } from "../../src/game/rootFactory.ts";
import { GoblinCampComponentId } from "../../src/game/component/goblinCampComponent.ts";
import {
    createTileComponent,
    getChunk,
    setChunk,
    TileComponentId,
} from "../../src/game/component/tileComponent.ts";
import { createWorldDiscoveryComponent } from "../../src/game/component/worldDiscoveryComponent.ts";
import { Terrain } from "../../src/game/map/terrain.ts";
import {
    ChunkSize,
    createLandTerrain,
    getChunkPosition,
    terrainIndex,
} from "../../src/game/map/chunk.ts";
import { Entity } from "../../src/game/entity/entity.ts";
import {
    buildWorldStateMessage,
    makeReplicatedEntitiesSystem,
} from "../../src/server/replicatedEntitiesSystem.ts";
import { handleGameMessage } from "../../src/server/message/gameMessageHandler.ts";
import { applyDiscoveredTiles } from "../../src/server/message/applyDiscoveredTiles.ts";
import {
    GroundUpdateGameMessageType,
    type GameMessage,
} from "../../src/server/message/gameMessage.ts";
import {
    createVisibilityMapComponent,
    VisibilityMapComponentId,
} from "../../src/game/component/visibilityMapComponent.ts";
import type { Volume } from "../../src/game/map/volume.ts";
import type { Point } from "../../src/common/point.ts";

function setupServerWorld(): { root: Entity; messages: GameMessage[] } {
    const messages: GameMessage[] = [];
    const root = createRootEntity();
    const ecsWorld = new EcsWorld(root);
    ecsWorld.addSystem(chunkMapSystem);
    ecsWorld.addSystem(worldGenerationSystem);
    ecsWorld.addSystem(
        makeReplicatedEntitiesSystem((message) => messages.push(message)),
    );
    ecsWorld.runInit();
    // world state covers everything so far so only later messages matter
    messages.length = 0;
    return { root, messages };
}

function getCampChunk(root: Entity): Point {
    const camps = root.queryComponents(GoblinCampComponentId);
    const campEntity = [...camps.keys()][0];
    return getChunkPosition(
        campEntity.worldPosition.x,
        campEntity.worldPosition.y,
    );
}

describe("world state replication", () => {
    it("includes all generated chunks, not just discovered ones", () => {
        const { root } = setupServerWorld();
        const { ground } = buildWorldStateMessage(root, "player", 0);

        assert.strictEqual(ground.chunks.length, 10);
        for (const chunk of ground.chunks) {
            assert.ok(
                ground.volumes.some((volume) => volume.id === chunk.volume),
                `volume ${chunk.volume} for chunk (${chunk.chunkX},${chunk.chunkY}) is missing from the message`,
            );
        }

        // The camp chunk starts undiscovered but its ground must still be
        // replicated, because its entities are
        const campChunk = getCampChunk(root);
        assert.ok(
            ground.chunks.some(
                (chunk) =>
                    chunk.chunkX === campChunk.x &&
                    chunk.chunkY === campChunk.y,
            ),
            "expected the camp chunk to be replicated",
        );
        assert.ok(
            !ground.discoveredTiles.some((tile) =>
                pointEquals(getChunkPosition(tile.x, tile.y), campChunk),
            ),
            "expected the camp chunk to start undiscovered",
        );
    });

    it("registers replicated chunks in the client tile component", () => {
        const { root } = setupServerWorld();
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

    it("keeps the registered volume instance when an update resends it", () => {
        const { root } = setupServerWorld();
        const clientRoot = new Entity("client-root");
        handleGameMessage(
            clientRoot,
            buildWorldStateMessage(root, "player", 0),
        );

        // The camp chunk is replicated but undiscovered. Discovering a tile
        // in it later resends its volume as a fresh object instance
        const campChunk = getCampChunk(root);
        const clientTiles = clientRoot.requireEcsComponent(TileComponentId);
        const registeredVolume = getChunk(clientTiles, campChunk)?.volume;
        assert.ok(registeredVolume);

        handleGameMessage(clientRoot, {
            type: GroundUpdateGameMessageType,
            ground: {
                volumes: [structuredClone(registeredVolume)],
                chunks: [],
                discoveredTiles: [
                    {
                        x: campChunk.x * ChunkSize + 2,
                        y: campChunk.y * ChunkSize + 5,
                    },
                ],
            },
        });

        assert.strictEqual(clientTiles.chunks.size, 10);
        assert.strictEqual(
            clientTiles.volume.get(registeredVolume.id),
            registeredVolume,
            "expected the update to keep the registered volume instance",
        );
        const visibilityMap = clientRoot.requireEcsComponent(
            VisibilityMapComponentId,
        );
        const partialChunk =
            visibilityMap.discovered.partiallyDiscoveredChunks.get(
                encodePosition(campChunk.x, campChunk.y),
            );
        assert.ok(partialChunk?.has(encodePosition(2, 5)));
    });

    it("replicates terrain in the world state", () => {
        const root = createRootEntity();
        const tiles = createTileComponent();
        root.setEcsComponent(tiles);
        root.setEcsComponent(createWorldDiscoveryComponent());
        const volume: Volume = {
            id: "vol-snow",
            maxSize: 4,
            chunks: [{ x: -3, y: 2 }],
            type: "snow",
            debugColor: "#fff",
        };
        const terrain = createLandTerrain();
        terrain[terrainIndex(3, 2)] = Terrain.Water;
        terrain[terrainIndex(6, 5)] = Terrain.Ice;
        setChunk(tiles, { chunkX: -3, chunkY: 2, volume, terrain });

        const clientRoot = new Entity("client-root");
        handleGameMessage(
            clientRoot,
            structuredClone(buildWorldStateMessage(root, "player", 0)),
        );

        const clientChunk = getChunk(
            clientRoot.requireEcsComponent(TileComponentId),
            { x: -3, y: 2 },
        );
        assert.deepStrictEqual(clientChunk?.terrain, terrain);
    });

    it("sends the ground of chunks generated by a later discovery", () => {
        const { root, messages } = setupServerWorld();
        const clientRoot = new Entity("client-root");
        handleGameMessage(
            clientRoot,
            buildWorldStateMessage(root, "player", 0),
        );

        const discovered = [
            { x: 43, y: -29 },
            { x: 51, y: -29 },
        ];
        setDiscoveryForPlayer(root, "player", discovered);
        for (const message of messages) {
            handleGameMessage(clientRoot, structuredClone(message));
        }

        assert.strictEqual(
            messages.filter(
                (message) => message.type === GroundUpdateGameMessageType,
            ).length,
            1,
        );
        const serverTiles = root.requireEcsComponent(TileComponentId);
        const clientTiles = clientRoot.requireEcsComponent(TileComponentId);
        assert.strictEqual(clientTiles.chunks.size, serverTiles.chunks.size);
        const visibilityMap = clientRoot.requireEcsComponent(
            VisibilityMapComponentId,
        );
        for (const point of discovered) {
            const chunkPosition = getChunkPosition(point.x, point.y);
            const serverChunk = getChunk(serverTiles, chunkPosition);
            const clientChunk = getChunk(clientTiles, chunkPosition);
            assert.ok(serverChunk?.volume);
            assert.ok(clientChunk?.volume);
            assert.strictEqual(clientChunk.volume.id, serverChunk.volume.id);
            assert.deepStrictEqual(clientChunk.terrain, serverChunk.terrain);
            assert.ok(
                visibilityMap.discovered.partiallyDiscoveredChunks.has(
                    encodePosition(chunkPosition.x, chunkPosition.y),
                ),
                `tile ${point.x},${point.y} is discovered on the client`,
            );
        }
    });

    it("sends nothing when a discovery finds nothing new", () => {
        const { root, messages } = setupServerWorld();
        const explored = [
            { x: 43, y: -29 },
            { x: 44, y: -29 },
        ];
        setDiscoveryForPlayer(root, "player", explored);
        messages.length = 0;

        setDiscoveryForPlayer(root, "player", explored);

        assert.ok(
            !messages.some(
                (message) => message.type === GroundUpdateGameMessageType,
            ),
        );
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
        const chunk = { x: 3, y: 2 };
        setChunk(tileComponent, {
            chunkX: chunk.x,
            chunkY: chunk.y,
            volume,
            terrain: createLandTerrain(),
        });

        const allTiles: Point[] = [];
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                allTiles.push({
                    x: chunk.x * ChunkSize + x,
                    y: chunk.y * ChunkSize + y,
                });
            }
        }
        applyDiscoveredTiles(tileComponent, visibilityMap, allTiles);

        const chunkId = encodePosition(chunk.x, chunk.y);
        assert.ok(visibilityMap.discovered.fullyDiscoveredChunks.has(chunkId));
        assert.ok(
            !visibilityMap.discovered.partiallyDiscoveredChunks.has(chunkId),
        );

        // A duplicate tile must not recreate partial discovery data next to
        // the fully discovered flag
        applyDiscoveredTiles(tileComponent, visibilityMap, [
            { x: chunk.x * ChunkSize + 1, y: chunk.y * ChunkSize + 1 },
        ]);

        assert.ok(visibilityMap.discovered.fullyDiscoveredChunks.has(chunkId));
        assert.ok(
            !visibilityMap.discovered.partiallyDiscoveredChunks.has(chunkId),
        );
    });
});
