import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, makeNumberId } from "../../../src/common/point.ts";
import {
    createTileComponent,
    setChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import {
    createVisibilityMapComponent,
    VisibilityMapComponentId,
} from "../../../src/game/component/visibilityMapComponent.ts";
import {
    createWorldDiscoveryComponent,
} from "../../../src/game/component/worldDiscoveryComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import { buildWorldStateMessage } from "../../../src/server/replicatedEntitiesSystem.ts";
import { WorldStateMessageType } from "../../../src/server/message/gameMessage.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";

function createTestVolume(id: string): Volume {
    return {
        id,
        type: "plains",
        debugColor: "#8dd66d",
        maxSize: 64,
        chunks: [],
    };
}

describe("replicatedEntitiesSystem", () => {
    describe("buildWorldStateMessage", () => {
        it("returns correct message type", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.type, WorldStateMessageType);
        });

        it("includes all root children recursively", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child1 = new Entity("child1");
            const child2 = new Entity("child2");
            const grandchild = new Entity("grandchild");

            child1.addChild(grandchild);
            root.addChild(child1);
            root.addChild(child2);

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.rootChildren.length, 2);

            const child1Data = message.rootChildren.find(
                (c) => c.id === "child1",
            );
            const child2Data = message.rootChildren.find(
                (c) => c.id === "child2",
            );

            assert.ok(child1Data, "Should include child1");
            assert.ok(child2Data, "Should include child2");

            assert.ok(child1Data.children, "child1 should have children");
            assert.strictEqual(child1Data.children.length, 1);
            assert.strictEqual(child1Data.children[0].id, "grandchild");
        });

        it("includes entity positions", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child = new Entity("child1");
            child.worldPosition = { x: 100, y: 200 };
            root.addChild(child);

            const message = buildWorldStateMessage(root, "player1");

            assert.deepStrictEqual(message.rootChildren[0].position, {
                x: 100,
                y: 200,
            });
        });

        it("includes entity components", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child = new Entity("child1");
            const healthComponent = createHealthComponent(50, 100);
            child.setEcsComponent(healthComponent);
            root.addChild(child);

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.rootChildren[0].components.length, 1);
            const component = message.rootChildren[0].components[0];
            assert.strictEqual(component.id, HealthComponentId);
        });

        it("filters client-only components (TileComponent)", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child = new Entity("child1");
            child.setEcsComponent(createTileComponent()); // Client-only
            child.setEcsComponent(createHealthComponent(50, 100));
            root.addChild(child);

            const message = buildWorldStateMessage(root, "player1");

            const childData = message.rootChildren[0];
            const hasClientOnlyComponent = childData.components.some(
                (c) => c.id === TileComponentId,
            );

            assert.ok(
                !hasClientOnlyComponent,
                "Should not include TileComponent",
            );
            assert.strictEqual(childData.components.length, 1);
            assert.strictEqual(childData.components[0].id, HealthComponentId);
        });

        it("filters client-only components (VisibilityMapComponent)", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child = new Entity("child1");
            child.setEcsComponent(createVisibilityMapComponent()); // Client-only
            child.setEcsComponent(createHealthComponent(50, 100));
            root.addChild(child);

            const message = buildWorldStateMessage(root, "player1");

            const childData = message.rootChildren[0];
            const hasClientOnlyComponent = childData.components.some(
                (c) => c.id === VisibilityMapComponentId,
            );

            assert.ok(
                !hasClientOnlyComponent,
                "Should not include VisibilityMapComponent",
            );
        });

        it("includes player discovered tiles and volumes", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            // Add player discovery data
            const chunkId = encodePosition(0, 0);
            discoveryComponent.discoveriesByUser.set("player1", {
                fullyDiscoveredChunks: new Set([chunkId]),
                partiallyDiscoveredChunks: new Map(),
            });

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(
                message.discoveredTiles.length,
                ChunkSize * ChunkSize,
            );
            assert.strictEqual(message.volumes.length, 1);
            assert.strictEqual(message.volumes[0].id, "vol1");
        });

        it("includes partially discovered tiles", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            // Add partial discovery
            const chunkId = encodePosition(0, 0);
            discoveryComponent.discoveriesByUser.set("player1", {
                fullyDiscoveredChunks: new Set(),
                partiallyDiscoveredChunks: new Map([
                    [
                        chunkId,
                        new Set([makeNumberId(0, 0), makeNumberId(1, 1)]),
                    ],
                ]),
            });

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.discoveredTiles.length, 2);
            assert.strictEqual(message.volumes.length, 1);
        });

        it("returns empty discoveredTiles when player has no discovery data", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            // No discovery data for player1

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.discoveredTiles.length, 0);
            assert.strictEqual(message.volumes.length, 0);
        });

        it("returns empty discoveredTiles for player with empty discovery", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            // Player exists but has discovered nothing
            discoveryComponent.discoveriesByUser.set("player1", {
                fullyDiscoveredChunks: new Set(),
                partiallyDiscoveredChunks: new Map(),
            });

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.discoveredTiles.length, 0);
            assert.strictEqual(message.volumes.length, 0);
        });

        it("only includes tiles for the requested player", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            setChunk(tileComponent, {
                chunkX: 1,
                chunkY: 0,
                volume: volume,
            });

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            // Player1 discovers chunk 0
            const chunk0Id = encodePosition(0, 0);
            discoveryComponent.discoveriesByUser.set("player1", {
                fullyDiscoveredChunks: new Set([chunk0Id]),
                partiallyDiscoveredChunks: new Map(),
            });

            // Player2 discovers chunk 1
            const chunk1Id = encodePosition(1, 0);
            discoveryComponent.discoveriesByUser.set("player2", {
                fullyDiscoveredChunks: new Set([chunk1Id]),
                partiallyDiscoveredChunks: new Map(),
            });

            const messageForPlayer1 = buildWorldStateMessage(root, "player1");
            const messageForPlayer2 = buildWorldStateMessage(root, "player2");

            // Player1 should only see tiles from chunk 0 (tiles 0-7 on x axis)
            assert.strictEqual(
                messageForPlayer1.discoveredTiles.length,
                ChunkSize * ChunkSize,
            );
            assert.ok(
                messageForPlayer1.discoveredTiles.every(
                    (t) => t.x >= 0 && t.x < ChunkSize,
                ),
            );

            // Player2 should only see tiles from chunk 1 (tiles 8-15 on x axis)
            assert.strictEqual(
                messageForPlayer2.discoveredTiles.length,
                ChunkSize * ChunkSize,
            );
            assert.ok(
                messageForPlayer2.discoveredTiles.every(
                    (t) => t.x >= ChunkSize && t.x < ChunkSize * 2,
                ),
            );
        });

        it("handles empty entity tree", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const message = buildWorldStateMessage(root, "player1");

            assert.strictEqual(message.rootChildren.length, 0);
            assert.strictEqual(message.discoveredTiles.length, 0);
            assert.strictEqual(message.volumes.length, 0);
        });

        it("includes parent reference in child data", () => {
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const parent = new Entity("parent");
            const child = new Entity("child");
            parent.addChild(child);
            root.addChild(parent);

            const message = buildWorldStateMessage(root, "player1");

            const parentData = message.rootChildren[0];
            assert.ok(parentData.children);
            assert.strictEqual(parentData.children[0].parent, "parent");
        });
    });
});
