import { describe, it } from "node:test";
import assert from "node:assert";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { pointEquals, type Point } from "../../../src/common/point.ts";
import {
    setDiscoveryForPlayer,
    worldGenerationSystem,
} from "../../../src/game/system/worldGenerationSystem.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import { createRootEntity } from "../../../src/game/rootFactory.ts";
import { createMessageEmitterComponent } from "../../../src/game/component/messageEmitterComponent.ts";
import { GoblinCampComponentId } from "../../../src/game/component/goblinCampComponent.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../src/game/component/chunkMapComponent.ts";
import {
    getChunk,
    hasChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import { getChunkBounds, getChunkPosition } from "../../../src/game/map/chunk.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import type { GameMessage } from "../../../src/server/message/gameMessage.ts";

function setupWorld(): {
    root: Entity;
    ecsWorld: EcsWorld;
    messages: GameMessage[];
} {
    const messages: GameMessage[] = [];
    const root = createRootEntity();
    root.setEcsComponent(
        createMessageEmitterComponent((message) => {
            messages.push(message);
        }),
    );
    const ecsWorld = new EcsWorld(root);
    ecsWorld.addSystem(chunkMapSystem);
    ecsWorld.addSystem(worldGenerationSystem);
    ecsWorld.runInit();
    return { root, ecsWorld, messages };
}

function getCampChunkPosition(root: Entity): Point {
    const camps = root.queryComponents(GoblinCampComponentId);
    assert.strictEqual(camps.size, 1, "expected exactly one goblin camp");
    const campEntity = [...camps.keys()][0];
    return getChunkPosition(
        campEntity.worldPosition.x,
        campEntity.worldPosition.y,
    );
}

function isInSubtree(entity: Entity, ancestor: Entity): boolean {
    let current: Entity | undefined | null = entity;
    while (current) {
        if (current === ancestor) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

const cardinalCampChunks: Point[] = [
    { x: 2, y: 0 },
    { x: -2, y: 0 },
    { x: 0, y: 2 },
    { x: 0, y: -2 },
];

describe("worldGenerationSystem", () => {
    it("generates ten initial chunks with a cardinal path to the goblin camp", () => {
        const seenCampChunks = new Set<string>();

        for (let iteration = 0; iteration < 25; iteration++) {
            const { root } = setupWorld();
            const tileComponent = root.requireEcsComponent(TileComponentId);

            assert.strictEqual(
                tileComponent.chunks.size,
                10,
                "expected exactly ten initial chunks",
            );

            // The 3x3 block around the player start chunk always exists
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    assert.ok(
                        hasChunk(tileComponent, { x, y }),
                        `expected chunk (${x},${y}) to exist`,
                    );
                }
            }

            const campChunk = getCampChunkPosition(root);
            seenCampChunks.add(`${campChunk.x},${campChunk.y}`);
            assert.ok(
                cardinalCampChunks.some((point) =>
                    pointEquals(point, campChunk),
                ),
                `expected camp chunk two chunks away in a cardinal direction, got (${campChunk.x},${campChunk.y})`,
            );
            assert.ok(
                hasChunk(tileComponent, campChunk),
                "expected the camp chunk to exist",
            );

            // The path chunk sits between the player and the camp and
            // always joins the start biome
            const pathChunk = { x: campChunk.x / 2, y: campChunk.y / 2 };
            assert.ok(
                hasChunk(tileComponent, pathChunk),
                `expected path chunk (${pathChunk.x},${pathChunk.y}) to exist`,
            );
            assert.strictEqual(
                getChunk(tileComponent, pathChunk)?.volume?.isStartBiome,
                true,
                "expected the path chunk to join the start biome",
            );

            const startVolume = getChunk(tileComponent, {
                x: 0,
                y: 0,
            })?.volume;
            assert.strictEqual(startVolume?.isStartBiome, true);
            const campVolume = getChunk(tileComponent, campChunk)?.volume;
            assert.ok(campVolume, "expected camp chunk to have a volume");
            assert.notStrictEqual(campVolume.isStartBiome, true);
        }

        // Direction is random; over 25 worlds we should see variety. Not
        // asserting all four to keep the test free of rare flakes.
        assert.ok(
            seenCampChunks.size >= 2,
            `expected camp direction to vary, only saw ${[...seenCampChunks].join(" | ")}`,
        );
    });

    it("places the goblin camp on unoccupied tiles", () => {
        for (let iteration = 0; iteration < 25; iteration++) {
            const { root } = setupWorld();
            const camps = root.queryComponents(GoblinCampComponentId);
            const campEntity = [...camps.keys()][0];
            const chunkMap =
                root.requireEcsComponent(ChunkMapComponentId).chunkMap;
            const campChunkBounds = getChunkBounds(
                getCampChunkPosition(root),
            );

            for (const child of campEntity.children) {
                const tile = child.worldPosition;
                assert.ok(
                    tile.x >= campChunkBounds.x1 &&
                        tile.x <= campChunkBounds.x2 &&
                        tile.y >= campChunkBounds.y1 &&
                        tile.y <= campChunkBounds.y2,
                    `camp entity ${child.id} at (${tile.x},${tile.y}) is outside the camp chunk`,
                );

                const occupants = getEntitiesAt(chunkMap, tile.x, tile.y);
                for (const occupant of occupants) {
                    assert.ok(
                        isInSubtree(occupant, campEntity),
                        `entity ${occupant.id} stacked on camp tile (${tile.x},${tile.y})`,
                    );
                }
            }
        }
    });

    it("respawns a goblin camp on later discovery when none exists", () => {
        const { root, messages } = setupWorld();

        const camps = root.queryComponents(GoblinCampComponentId);
        const campEntity = [...camps.keys()][0];
        campEntity.removeEcsComponent(GoblinCampComponentId);
        assert.strictEqual(
            root.queryComponents(GoblinCampComponentId).size,
            0,
        );

        const messageEmitter = (message: GameMessage) => {
            messages.push(message);
        };
        // Discover a tile in a far, ungenerated chunk (10,10)
        setDiscoveryForPlayer(root, messageEmitter, "player", [
            { x: 80, y: 80 },
        ]);

        const newCampChunk = getCampChunkPosition(root);
        assert.deepStrictEqual(newCampChunk, { x: 10, y: 10 });
    });

    it("skips generation when a world already exists", () => {
        const { root } = setupWorld();

        worldGenerationSystem.onInit!(root);

        const tileComponent = root.requireEcsComponent(TileComponentId);
        assert.strictEqual(tileComponent.chunks.size, 10);
        assert.strictEqual(
            root.queryComponents(GoblinCampComponentId).size,
            1,
        );
    });
});
