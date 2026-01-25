import assert from "node:assert";
import { describe, it } from "node:test";
import { TileComponentId } from "../../../src/game/component/tileComponent.ts";
import { VisibilityMapComponentId } from "../../../src/game/component/visibilityMapComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { Camera } from "../../../src/rendering/camera.ts";
import { handleGameMessage } from "../../../src/server/message/gameMessageHandler.ts";
import {
    WorldStateMessageType,
    AddEntityGameMessageType,
    RemoveEntityGameMessageType,
    SetComponentGameMessageType,
    TransformGameMessageType,
    type WorldStateGameMessage,
    type AddEntityGameMessage,
    type RemoveEntityGameMessage,
    type SetComponentGameMessage,
    type TransformGameMessage,
} from "../../../src/server/message/gameMessage.ts";
import type { Volume } from "../../../src/game/map/volume.ts";

function createTestVolume(id: string): Volume {
    return {
        id,
        type: "plains",
        debugColor: "#8dd66d",
        maxSize: 64,
        chunks: [],
    };
}

function createTestCamera(): Camera {
    return new Camera({ x: 800, y: 600 });
}

describe("gameMessageHandler", () => {
    describe("WorldStateGameMessage", () => {
        it("creates TileComponent if missing", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [],
                discoveredTiles: [],
                volumes: [],
            };

            assert.ok(
                !root.getEcsComponent(TileComponentId),
                "Should not have TileComponent initially",
            );

            handleGameMessage(root, camera, message);

            assert.ok(
                root.getEcsComponent(TileComponentId),
                "Should create TileComponent",
            );
        });

        it("creates VisibilityMapComponent if missing", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [],
                discoveredTiles: [],
                volumes: [],
            };

            assert.ok(
                !root.getEcsComponent(VisibilityMapComponentId),
                "Should not have VisibilityMapComponent initially",
            );

            handleGameMessage(root, camera, message);

            assert.ok(
                root.getEcsComponent(VisibilityMapComponentId),
                "Should create VisibilityMapComponent",
            );
        });

        it("applies discovered tiles and volumes", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const volume = createTestVolume("vol1");

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [],
                discoveredTiles: [
                    { x: 0, y: 0, volume: "vol1" },
                    { x: 1, y: 1, volume: "vol1" },
                ],
                volumes: [volume],
            };

            handleGameMessage(root, camera, message);

            const tileComponent = root.getEcsComponent(TileComponentId);
            assert.ok(tileComponent);
            assert.ok(
                tileComponent.volume.has("vol1"),
                "Should register volume",
            );
            assert.strictEqual(
                tileComponent.chunks.size,
                1,
                "Should create chunk",
            );
        });

        it("creates entities from rootChildren", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [
                    {
                        id: "entity1",
                        position: { x: 10, y: 20 },
                        components: [],
                    },
                    {
                        id: "entity2",
                        position: { x: 30, y: 40 },
                        components: [],
                    },
                ],
                discoveredTiles: [],
                volumes: [],
            };

            handleGameMessage(root, camera, message);

            assert.strictEqual(root.children.length, 2);

            const entity1 = root.findEntity("entity1");
            assert.ok(entity1, "Should create entity1");
            assert.deepStrictEqual(entity1.worldPosition, { x: 10, y: 20 });

            const entity2 = root.findEntity("entity2");
            assert.ok(entity2, "Should create entity2");
            assert.deepStrictEqual(entity2.worldPosition, { x: 30, y: 40 });
        });

        it("creates entity hierarchy with nested children", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [
                    {
                        id: "parent",
                        position: { x: 0, y: 0 },
                        components: [],
                        children: [
                            {
                                id: "child",
                                position: { x: 5, y: 5 },
                                components: [],
                                children: [
                                    {
                                        id: "grandchild",
                                        position: { x: 10, y: 10 },
                                        components: [],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                discoveredTiles: [],
                volumes: [],
            };

            handleGameMessage(root, camera, message);

            const parent = root.findEntity("parent");
            const child = root.findEntity("child");
            const grandchild = root.findEntity("grandchild");

            assert.ok(parent);
            assert.ok(child);
            assert.ok(grandchild);

            assert.strictEqual(parent.children.length, 1);
            assert.strictEqual(parent.children[0].id, "child");
            assert.strictEqual(child.children.length, 1);
            assert.strictEqual(child.children[0].id, "grandchild");
        });

        it("adds components to created entities", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const healthComponent = createHealthComponent(50, 100);

            const message: WorldStateGameMessage = {
                type: WorldStateMessageType,
                rootChildren: [
                    {
                        id: "entity1",
                        position: { x: 0, y: 0 },
                        components: [healthComponent],
                    },
                ],
                discoveredTiles: [],
                volumes: [],
            };

            handleGameMessage(root, camera, message);

            const entity = root.findEntity("entity1");
            assert.ok(entity);

            const component = entity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 50);
            assert.strictEqual(component.maxHp, 100);
        });
    });

    describe("AddEntityGameMessage", () => {
        it("creates entity with specified ID", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: AddEntityGameMessage = {
                type: AddEntityGameMessageType,
                id: "newEntity",
                position: { x: 100, y: 200 },
                components: [],
            };

            handleGameMessage(root, camera, message);

            const entity = root.findEntity("newEntity");
            assert.ok(entity, "Should create entity");
            assert.deepStrictEqual(entity.worldPosition, { x: 100, y: 200 });
        });

        it("creates entity as child of specified parent", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const parent = new Entity("parent");
            root.addChild(parent);

            const message: AddEntityGameMessage = {
                type: AddEntityGameMessageType,
                id: "child",
                parent: "parent",
                position: { x: 50, y: 50 },
                components: [],
            };

            handleGameMessage(root, camera, message);

            const child = root.findEntity("child");
            assert.ok(child);
            assert.strictEqual(child.parent?.id, "parent");
            assert.strictEqual(parent.children.length, 1);
        });

        it("creates entity hierarchy with children", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: AddEntityGameMessage = {
                type: AddEntityGameMessageType,
                id: "parent",
                position: { x: 0, y: 0 },
                components: [],
                children: [
                    {
                        id: "child1",
                        position: { x: 10, y: 10 },
                        components: [],
                    },
                    {
                        id: "child2",
                        position: { x: 20, y: 20 },
                        components: [],
                    },
                ],
            };

            handleGameMessage(root, camera, message);

            const parent = root.findEntity("parent");
            assert.ok(parent);
            assert.strictEqual(parent.children.length, 2);

            const child1 = root.findEntity("child1");
            const child2 = root.findEntity("child2");
            assert.ok(child1);
            assert.ok(child2);
        });

        it("merges server data when entity already exists", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            // Client creates entity first
            const existingEntity = new Entity("entity1");
            existingEntity.worldPosition = { x: 0, y: 0 };
            root.addChild(existingEntity);

            // Server sends message with same ID but different data
            const serverComponent = createHealthComponent(80, 100);

            const message: AddEntityGameMessage = {
                type: AddEntityGameMessageType,
                id: "entity1",
                position: { x: 50, y: 75 },
                components: [serverComponent],
            };

            handleGameMessage(root, camera, message);

            // Should not create duplicate
            assert.strictEqual(root.children.length, 1);

            // Should update position
            assert.deepStrictEqual(existingEntity.worldPosition, {
                x: 50,
                y: 75,
            });

            // Should add server component
            const component = existingEntity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 80);
        });
    });

    describe("RemoveEntityGameMessage", () => {
        it("removes entity from tree", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const entity = new Entity("toRemove");
            root.addChild(entity);

            assert.strictEqual(root.children.length, 1);

            const message: RemoveEntityGameMessage = {
                type: RemoveEntityGameMessageType,
                entity: "toRemove",
            };

            handleGameMessage(root, camera, message);

            assert.strictEqual(root.children.length, 0);
            assert.ok(!root.findEntity("toRemove"));
        });

        it("handles removal of non-existent entity gracefully", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: RemoveEntityGameMessage = {
                type: RemoveEntityGameMessageType,
                entity: "nonexistent",
            };

            // Should not throw
            handleGameMessage(root, camera, message);
        });

        it("removes entity from nested hierarchy", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const parent = new Entity("parent");
            const child = new Entity("child");
            root.addChild(parent);
            parent.addChild(child);

            const message: RemoveEntityGameMessage = {
                type: RemoveEntityGameMessageType,
                entity: "child",
            };

            handleGameMessage(root, camera, message);

            assert.strictEqual(parent.children.length, 0);
            assert.ok(!root.findEntity("child"));
            assert.ok(
                root.findEntity("parent"),
                "Parent should still exist",
            );
        });
    });

    describe("SetComponentGameMessage", () => {
        it("updates component on entity", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const entity = new Entity("entity1");
            entity.setEcsComponent(createHealthComponent(50, 100));
            root.addChild(entity);

            const message: SetComponentGameMessage = {
                type: SetComponentGameMessageType,
                entity: "entity1",
                component: createHealthComponent(75, 100),
            };

            handleGameMessage(root, camera, message);

            const component = entity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 75);
        });

        it("handles set component on non-existent entity gracefully", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: SetComponentGameMessage = {
                type: SetComponentGameMessageType,
                entity: "nonexistent",
                component: createHealthComponent(50, 100),
            };

            // Should not throw
            handleGameMessage(root, camera, message);
        });

        it("adds new component if not present", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const entity = new Entity("entity1");
            root.addChild(entity);

            const message: SetComponentGameMessage = {
                type: SetComponentGameMessageType,
                entity: "entity1",
                component: createHealthComponent(42, 100),
            };

            handleGameMessage(root, camera, message);

            const component = entity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 42);
        });
    });

    describe("TransformGameMessage", () => {
        it("updates entity position", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const entity = new Entity("entity1");
            entity.worldPosition = { x: 0, y: 0 };
            root.addChild(entity);

            const message: TransformGameMessage = {
                type: TransformGameMessageType,
                entity: "entity1",
                position: { x: 500, y: 300 },
                oldPosition: { x: 0, y: 0 },
            };

            handleGameMessage(root, camera, message);

            assert.deepStrictEqual(entity.worldPosition, { x: 500, y: 300 });
        });

        it("handles transform on non-existent entity gracefully", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const message: TransformGameMessage = {
                type: TransformGameMessageType,
                entity: "nonexistent",
                position: { x: 100, y: 100 },
                oldPosition: { x: 0, y: 0 },
            };

            // Should not throw
            handleGameMessage(root, camera, message);
        });

        it("updates nested entity position", () => {
            const root = new Entity("root");
            const camera = createTestCamera();

            const parent = new Entity("parent");
            const child = new Entity("child");
            root.addChild(parent);
            parent.addChild(child);

            const message: TransformGameMessage = {
                type: TransformGameMessageType,
                entity: "child",
                position: { x: 200, y: 150 },
                oldPosition: { x: 0, y: 0 },
            };

            handleGameMessage(root, camera, message);

            assert.deepStrictEqual(child.worldPosition, { x: 200, y: 150 });
        });
    });
});
