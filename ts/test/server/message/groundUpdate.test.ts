import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../src/common/point.ts";
import {
    createTileComponent,
    getChunk,
    getTile,
    type TileComponent,
} from "../../../src/game/component/tileComponent.ts";
import {
    createVisibilityMapComponent,
    type VisibilityMapComponent,
} from "../../../src/game/component/visibilityMapComponent.ts";
import {
    ChunkSize,
    createLandTerrain,
    terrainIndex,
    type TileChunk,
} from "../../../src/game/map/chunk.ts";
import { Terrain } from "../../../src/game/map/terrain.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import type { GroundUpdate } from "../../../src/server/message/gameMessage.ts";
import {
    applyGroundUpdate,
    buildGroundUpdate,
} from "../../../src/server/message/groundUpdate.ts";

function createVolume(id: string, chunks: Point[]): Volume {
    return {
        id,
        type: "swamp",
        debugColor: "#08543d",
        maxSize: 8,
        chunks,
    };
}

function createChunk(
    volume: Volume,
    chunkX: number,
    chunkY: number,
    ponds: { local: Point; terrain: Terrain }[] = [],
): TileChunk {
    const terrain = createLandTerrain();
    for (const pond of ponds) {
        terrain[terrainIndex(pond.local.x, pond.local.y)] = pond.terrain;
    }
    return { chunkX, chunkY, volume, terrain };
}

function worldTile(chunk: Point, localX: number, localY: number): Point {
    return {
        x: chunk.x * ChunkSize + localX,
        y: chunk.y * ChunkSize + localY,
    };
}

type Client = {
    tiles: TileComponent;
    visibility: VisibilityMapComponent;
};

function createClient(): Client {
    return {
        tiles: createTileComponent(),
        visibility: createVisibilityMapComponent(),
    };
}

function receive(client: Client, update: GroundUpdate) {
    applyGroundUpdate(client.tiles, client.visibility, structuredClone(update));
}

describe("ground update", () => {
    it("gives the client the server chunk's terrain", () => {
        const chunk = { x: 3, y: -2 };
        const volume = createVolume("vol-swamp", [chunk]);
        const serverChunk = createChunk(volume, chunk.x, chunk.y, [
            { local: { x: 4, y: 2 }, terrain: Terrain.Water },
            { local: { x: 5, y: 2 }, terrain: Terrain.Ice },
        ]);

        const client = createClient();
        receive(client, buildGroundUpdate([serverChunk], []));

        assert.deepStrictEqual(
            getChunk(client.tiles, chunk)?.terrain,
            serverChunk.terrain,
        );
        assert.strictEqual(
            getTile(client.tiles, worldTile(chunk, 4, 2))?.terrain,
            Terrain.Water,
        );
        assert.strictEqual(
            getTile(client.tiles, worldTile(chunk, 5, 2))?.terrain,
            Terrain.Ice,
        );
        assert.strictEqual(
            getTile(client.tiles, worldTile(chunk, 1, 2))?.terrain,
            Terrain.Land,
        );
    });

    it("sends each chunk's volume once, and no volume without a chunk", () => {
        const swamp = createVolume("vol-swamp", [
            { x: 3, y: -2 },
            { x: 4, y: -2 },
        ]);
        const forrest = createVolume("vol-forrest", [{ x: 7, y: 5 }]);

        const update = buildGroundUpdate(
            [createChunk(swamp, 3, -2), createChunk(swamp, 4, -2)],
            [],
        );

        assert.deepStrictEqual(
            update.volumes.map((volume) => volume.id),
            [swamp.id],
        );
        assert.ok(!update.volumes.some((volume) => volume.id === forrest.id));
    });

    it("leaves out chunks without a volume", () => {
        const update = buildGroundUpdate(
            [{ chunkX: 3, chunkY: -2, terrain: createLandTerrain() }],
            [],
        );

        assert.strictEqual(update.chunks.length, 0);
    });

    it("ends in the same state as a snapshot when applied piece by piece", () => {
        const swamp = createVolume("vol-swamp", [
            { x: 3, y: -2 },
            { x: 4, y: -2 },
        ]);
        const forrest = createVolume("vol-forrest", [{ x: 7, y: 5 }]);
        const chunks = [
            createChunk(swamp, 3, -2, [
                { local: { x: 1, y: 6 }, terrain: Terrain.Water },
            ]),
            createChunk(swamp, 4, -2),
            createChunk(forrest, 7, 5, [
                { local: { x: 6, y: 0 }, terrain: Terrain.Ice },
            ]),
        ];
        const earlyTiles = [
            worldTile({ x: 3, y: -2 }, 1, 5),
            worldTile({ x: 3, y: -2 }, 2, 5),
        ];
        const laterTiles = [worldTile({ x: 7, y: 5 }, 2, 4)];

        const joinedLate = createClient();
        receive(
            joinedLate,
            buildGroundUpdate(chunks, [...earlyTiles, ...laterTiles]),
        );

        const playedAlong = createClient();
        receive(playedAlong, buildGroundUpdate(chunks.slice(0, 2), earlyTiles));
        receive(playedAlong, buildGroundUpdate(chunks.slice(2), laterTiles));

        assert.deepStrictEqual(
            [...playedAlong.tiles.chunks.keys()].sort(),
            [...joinedLate.tiles.chunks.keys()].sort(),
        );
        for (const [id, chunk] of joinedLate.tiles.chunks) {
            assert.deepStrictEqual(
                playedAlong.tiles.chunks.get(id)?.terrain,
                chunk.terrain,
            );
        }
        assert.deepStrictEqual(
            playedAlong.visibility.discovered,
            joinedLate.visibility.discovered,
        );
        assert.strictEqual(
            joinedLate.visibility.discovered.partiallyDiscoveredChunks.size,
            2,
            "the discovered tiles landed in their chunks, so the comparison covers discovery",
        );
    });

    it("adds a new chunk to a volume the client already knows", () => {
        const client = createClient();
        const clientVolume = createVolume("vol-swamp", [{ x: 3, y: -2 }]);
        client.tiles.volume.set(clientVolume.id, clientVolume);

        receive(client, {
            volumes: [],
            chunks: [
                {
                    chunkX: 4,
                    chunkY: -2,
                    volume: clientVolume.id,
                    terrain: createLandTerrain(),
                },
            ],
            discoveredTiles: [],
        });

        assert.strictEqual(
            getChunk(client.tiles, { x: 4, y: -2 })?.volume,
            clientVolume,
        );
        assert.deepStrictEqual(clientVolume.chunks, [
            { x: 3, y: -2 },
            { x: 4, y: -2 },
        ]);
    });

    it("skips a chunk whose volume the client does not have", () => {
        const client = createClient();

        receive(client, {
            volumes: [],
            chunks: [
                {
                    chunkX: 4,
                    chunkY: -2,
                    volume: "vol-unknown",
                    terrain: createLandTerrain(),
                },
            ],
            discoveredTiles: [worldTile({ x: 4, y: -2 }, 3, 4)],
        });

        assert.strictEqual(client.tiles.chunks.size, 0);
        assert.ok(
            !client.visibility.discovered.partiallyDiscoveredChunks.has(
                encodePosition(4, -2),
            ),
            "no discovery is tracked for ground the client does not have",
        );
    });
});
