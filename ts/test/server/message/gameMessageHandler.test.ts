import assert from "node:assert";
import { describe, it } from "node:test";
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
    type GroundUpdate,
    type AddEntityGameMessage,
    type RemoveEntityGameMessage,
    type SetComponentGameMessage,
    type TransformGameMessage,
} from "../../../src/server/message/gameMessage.ts";

const noGround: GroundUpdate = {
    volumes: [],
    chunks: [],
    discoveredTiles: [],
};

function createTestCamera(): Camera {
    return new Camera({ x: 800, y: 600 });
}

describe("gameMessageHandler", () => {
    describe("WorldStateGameMessage", () => {
        it("creates entity hierarchy with nested children", () => {
            const root = new Entity("root");

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
                ground: noGround,
                serverTick: 0,
                replicatedRootComponents: [],
            };

            handleGameMessage(root, message);

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
                ground: noGround,
                serverTick: 0,
                replicatedRootComponents: [],
            };

            handleGameMessage(root, message);

            const entity = root.findEntity("entity1");
            assert.ok(entity);

            const component = entity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 50);
            assert.strictEqual(component.maxHp, 100);
        });
    });

    describe("AddEntityGameMessage", () => {
        it("creates entity as child of specified parent", () => {
            const root = new Entity("root");

            const parent = new Entity("parent");
            root.addChild(parent);

            const message: AddEntityGameMessage = {
                type: AddEntityGameMessageType,
                id: "child",
                parent: "parent",
                position: { x: 50, y: 50 },
                components: [],
            };

            handleGameMessage(root, message);

            const child = root.findEntity("child");
            assert.ok(child);
            assert.strictEqual(child.parent?.id, "parent");
            assert.strictEqual(parent.children.length, 1);
        });

        it("merges server data when entity already exists", () => {
            const root = new Entity("root");

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

            handleGameMessage(root, message);

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
        it("removes entity from nested hierarchy", () => {
            const root = new Entity("root");

            const parent = new Entity("parent");
            const child = new Entity("child");
            root.addChild(parent);
            parent.addChild(child);

            const message: RemoveEntityGameMessage = {
                type: RemoveEntityGameMessageType,
                entity: "child",
            };

            handleGameMessage(root, message);

            assert.strictEqual(parent.children.length, 0);
            assert.ok(!root.findEntity("child"));
            assert.ok(root.findEntity("parent"), "Parent should still exist");
        });
    });

    describe("SetComponentGameMessage", () => {
        it("updates component on entity", () => {
            const root = new Entity("root");

            const entity = new Entity("entity1");
            entity.setEcsComponent(createHealthComponent(50, 100));
            root.addChild(entity);

            const message: SetComponentGameMessage = {
                type: SetComponentGameMessageType,
                entity: "entity1",
                component: createHealthComponent(75, 100),
            };

            handleGameMessage(root, message);

            const component = entity.getEcsComponent(HealthComponentId);
            assert.ok(component);
            assert.strictEqual(component.currentHp, 75);
        });

        it("drops a component addressed to an entity it does not hold", () => {
            const root = new Entity("root");

            const message: SetComponentGameMessage = {
                type: SetComponentGameMessageType,
                entity: "nonexistent",
                component: createHealthComponent(50, 100),
            };

            handleGameMessage(root, message);

            assert.strictEqual(root.getEcsComponent(HealthComponentId), null);
            assert.strictEqual(root.children.length, 0);
        });
    });

    describe("TransformGameMessage", () => {
        it("updates nested entity position", () => {
            const root = new Entity("root");

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

            handleGameMessage(root, message);

            assert.deepStrictEqual(child.worldPosition, { x: 200, y: 150 });
        });
    });
});
