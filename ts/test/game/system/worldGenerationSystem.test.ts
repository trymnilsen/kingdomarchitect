import { describe, it } from "node:test";
import assert from "node:assert";
import { EcsWorld } from "../../../src/ecs/ecsWorld.ts";
import { pointEquals, type Point } from "../../../src/common/point.ts";
import {
    makeWorldGenSystem,
    type GroundDiscovery,
} from "../../../src/game/system/worldGenerationSystem.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import { createRootEntity } from "../../../src/game/rootFactory.ts";
import { GoblinCampComponentId } from "../../../src/game/component/goblinCampComponent.ts";
import { findPlayerKingdom } from "../../../src/game/component/playerKingdomComponent.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { EquipmentComponentId } from "../../../src/game/component/equipmentComponent.ts";
import { LightSourceComponentId } from "../../../src/game/component/lightSourceComponent.ts";
import {
    createWorldDiscoveryComponent,
    hasDiscoveredTile,
    WorldDiscoveryComponentId,
} from "../../../src/game/component/worldDiscoveryComponent.ts";
import { torchItem } from "../../../src/data/inventory/items/equipment.ts";
import { lampPostLightSource } from "../../../src/data/light/lightSourceDefinition.ts";
import type { EcsSystem } from "../../../src/ecs/ecsSystem.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../src/game/component/chunkMapComponent.ts";
import {
    getChunk,
    hasChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import {
    ChunkSize,
    getChunkBounds,
    getChunkPosition,
} from "../../../src/game/map/chunk.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createKingdomComponent,
    KingdomType,
} from "../../../src/game/component/kingdomComponent.ts";

type TestWorld = {
    root: Entity;
    system: EcsSystem;
    /** Every discovery the system reported, in order, including startup */
    discoveries: GroundDiscovery[];
};

function setupWorld(): TestWorld {
    const discoveries: GroundDiscovery[] = [];
    const root = createRootEntity();
    const ecsWorld = new EcsWorld(root);
    const system = makeWorldGenSystem((discovery) => {
        discoveries.push(discovery);
    });
    ecsWorld.addSystem(chunkMapSystem);
    ecsWorld.addSystem(system);
    ecsWorld.runInit();
    return { root, system, discoveries };
}

/**
 * Puts a worker under the player kingdom and steps it onto the position, the
 * way a real worker discovers land by moving.
 */
function placeViewer(root: Entity, position: Point): Entity {
    const kingdom = findPlayerKingdom(root);
    assert.ok(kingdom, "expected the new world to have a player kingdom");
    const viewer = workerPrefab();
    kingdom.addChild(viewer);
    viewer.worldPosition = position;
    return viewer;
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

        // Direction is random. Over 25 worlds we should see variety. Not
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
            const campChunkBounds = getChunkBounds(getCampChunkPosition(root));

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
        const { root } = setupWorld();

        const camps = root.queryComponents(GoblinCampComponentId);
        const campEntity = [...camps.keys()][0];
        campEntity.removeEcsComponent(GoblinCampComponentId);
        assert.strictEqual(root.queryComponents(GoblinCampComponentId).size, 0);

        // Walk a worker into a far, ungenerated chunk (10,10)
        placeViewer(root, {
            x: 10 * ChunkSize + 8,
            y: 10 * ChunkSize + 8,
        });

        const newCampChunk = getCampChunkPosition(root);
        assert.deepStrictEqual(newCampChunk, { x: 10, y: 10 });
    });

    it("skips generation when a world already exists", () => {
        const { root, system } = setupWorld();

        system.onInit!(root);

        const tileComponent = root.requireEcsComponent(TileComponentId);
        assert.strictEqual(tileComponent.chunks.size, 10);
        assert.strictEqual(root.queryComponents(GoblinCampComponentId).size, 1);
    });
});

describe("worldGenerationSystem discovery", () => {
    // The middle of chunk (1,1), which exists from the start. It lies far
    // outside the radius-16 diamond revealed around the start position, and
    // far enough from the chunk edges that nothing near it needs generating.
    const farTile = { x: 24, y: 24 };

    it("reveals the footprint of a viewer that moves and reports it once", () => {
        const { root, discoveries } = setupWorld();
        const worldDiscovery = root.requireEcsComponent(
            WorldDiscoveryComponentId,
        );
        assert.ok(!hasDiscoveredTile(worldDiscovery, "player", farTile));
        const before = discoveries.length;

        const viewer = placeViewer(root, farTile);

        assert.strictEqual(discoveries.length, before + 1);
        const discovery = discoveries[discoveries.length - 1];
        assert.deepStrictEqual(discovery.generatedChunks, []);
        // A worker sees a diamond of radius 2 around itself
        assert.ok(
            hasDiscoveredTile(worldDiscovery, "player", { x: 26, y: 24 }),
        );
        assert.ok(
            hasDiscoveredTile(worldDiscovery, "player", { x: 23, y: 23 }),
        );
        assert.ok(
            !hasDiscoveredTile(worldDiscovery, "player", { x: 27, y: 24 }),
        );
        assert.strictEqual(discovery.discoveredTiles.length, 13);

        // Stepping back onto tiles it already revealed finds nothing new
        viewer.worldPosition = { x: 24, y: 25 };
        const afterStep = discoveries.length;
        viewer.worldPosition = farTile;
        assert.strictEqual(discoveries.length, afterStep);
    });

    it("generates a chunk once when a reveal reaches into it", () => {
        const { root, discoveries } = setupWorld();
        const before = discoveries.length;

        // Generating the chunk adds entities that fire their own events. None
        // of them may start another reveal, so the reveal reports once.
        placeViewer(root, { x: 10 * ChunkSize + 8, y: 10 * ChunkSize + 8 });

        assert.strictEqual(discoveries.length, before + 1);
        assert.deepStrictEqual(discoveries[before].generatedChunks, [
            { x: 10, y: 10 },
        ]);
    });

    it("reveals the wedge when the light source of a viewer changes", () => {
        const { root } = setupWorld();
        const worldDiscovery = root.requireEcsComponent(
            WorldDiscoveryComponentId,
        );
        const viewer = placeViewer(root, farTile);
        const beamTip = { x: farTile.x + 6, y: farTile.y };
        assert.ok(!hasDiscoveredTile(worldDiscovery, "player", beamTip));

        // Well beyond the worker's own reach of 2, so only the light can
        // account for it being discovered
        viewer.updateComponent(LightSourceComponentId, (component) => {
            component.pattern = [{ x: 6, y: 0 }];
        });

        assert.ok(hasDiscoveredTile(worldDiscovery, "player", beamTip));
    });

    it("reveals the light of an item when a viewer equips it", () => {
        const { root } = setupWorld();
        const worldDiscovery = root.requireEcsComponent(
            WorldDiscoveryComponentId,
        );
        const viewer = placeViewer(root, farTile);
        const litTile = { x: farTile.x + 4, y: farTile.y };
        assert.ok(!hasDiscoveredTile(worldDiscovery, "player", litTile));

        // A torch lights radius 1, which the worker already sees. Use a
        // brighter light so the equipment is the only thing that can explain it.
        viewer.updateComponent(EquipmentComponentId, (component) => {
            component.slots.primary = {
                ...torchItem,
                light: lampPostLightSource.id,
            };
        });

        assert.ok(hasDiscoveredTile(worldDiscovery, "player", litTile));
    });

    it("ignores events until the system has initialised", () => {
        // A load attaches entities while handlers are live, and revealing from
        // half a world could generate chunks and place a second goblin camp.
        const discoveries: GroundDiscovery[] = [];
        const root = createRootEntity();
        root.setEcsComponent(createWorldDiscoveryComponent());
        const ecsWorld = new EcsWorld(root);
        ecsWorld.addSystem(chunkMapSystem);
        ecsWorld.addSystem(
            makeWorldGenSystem((discovery) => discoveries.push(discovery)),
        );
        const kingdom = new Entity("kingdom");
        kingdom.setEcsComponent(createKingdomComponent(KingdomType.Player));
        root.addChild(kingdom);
        const viewer = workerPrefab();
        kingdom.addChild(viewer);

        viewer.worldPosition = { x: 5 * ChunkSize, y: 5 * ChunkSize };

        assert.strictEqual(discoveries.length, 0);
        assert.strictEqual(
            root.requireEcsComponent(TileComponentId).chunks.size,
            0,
        );
    });
});
