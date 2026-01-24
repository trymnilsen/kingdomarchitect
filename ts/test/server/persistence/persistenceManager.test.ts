import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createTileComponent } from "../../../src/game/component/tileComponent.ts";
import { createWorldDiscoveryComponent } from "../../../src/game/component/worldDiscoveryComponent.ts";
import { PersistenceManager } from "../../../src/server/persistence/persistenceManager.ts";
import { TestAdapter } from "./testAdapter.ts";

describe("PersistenceManager", () => {
    describe("Root Components", () => {
        it("saves root components separately from entity tree", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            root.setEcsComponent(tileComponent);
            root.setEcsComponent(discoveryComponent);

            const child = new Entity("child");
            root.addChild(child);

            await manager.saveWorld(root);

            const storedComponents = adapter.getStoredRootComponents();
            assert.ok(storedComponents, "Root components should be saved");
            assert.ok(
                storedComponents["Tile"],
                "TileComponent should be in root components",
            );
            assert.ok(
                storedComponents["worldDiscovery"],
                "WorldDiscoveryComponent should be in root components",
            );

            const storedEntities = adapter.getStoredEntities();
            assert.strictEqual(
                storedEntities.length,
                1,
                "Should save child entity",
            );
            assert.strictEqual(
                storedEntities[0].id,
                "child",
                "Saved entity should be the child",
            );
        });

        it("loads root components before entity tree", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const tileComponent = createTileComponent();
            const discoveryComponent = createWorldDiscoveryComponent();

            saveRoot.setEcsComponent(tileComponent);
            saveRoot.setEcsComponent(discoveryComponent);

            const child = new Entity("child");
            saveRoot.addChild(child);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            const loaded = await manager.load(loadRoot);

            assert.ok(loaded, "Should successfully load save");
            assert.ok(
                loadRoot.getEcsComponent("Tile"),
                "Root should have TileComponent",
            );
            assert.ok(
                loadRoot.getEcsComponent("worldDiscovery"),
                "Root should have WorldDiscoveryComponent",
            );
            assert.strictEqual(
                loadRoot.children.length,
                1,
                "Root should have one child",
            );
            assert.strictEqual(
                loadRoot.children[0].id,
                "child",
                "Child should be loaded",
            );
        });

        it("does not save runtime-only components", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const root = new Entity("root");

            const tileComponent = createTileComponent();
            root.setEcsComponent(tileComponent);
            root.setEcsComponent({
                id: "ChunkMap",
                chunkMap: { chunks: new Map(), entityChunkMap: new Map() },
            });

            await manager.saveWorld(root);

            const storedComponents = adapter.getStoredRootComponents();
            assert.ok(storedComponents, "Root components should be saved");
            assert.ok(
                storedComponents["Tile"],
                "TileComponent should be saved",
            );
            assert.ok(
                !storedComponents["ChunkMap"],
                "ChunkMap (runtime-only) should not be saved",
            );
        });
    });

    describe("Entity Tree", () => {
        it("saves and loads entity hierarchy", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const parent = new Entity("parent");
            const child1 = new Entity("child1");
            const child2 = new Entity("child2");
            const grandchild = new Entity("grandchild");

            saveRoot.addChild(parent);
            parent.addChild(child1);
            parent.addChild(child2);
            child1.addChild(grandchild);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            const loaded = await manager.load(loadRoot);

            assert.ok(loaded, "Should successfully load save");
            assert.strictEqual(
                loadRoot.children.length,
                1,
                "Root should have one child",
            );

            const loadedParent = loadRoot.children[0];
            assert.strictEqual(loadedParent.id, "parent");
            assert.strictEqual(
                loadedParent.children.length,
                2,
                "Parent should have two children",
            );

            const loadedChild1 = loadedParent.children.find(
                (c) => c.id === "child1",
            );
            const loadedChild2 = loadedParent.children.find(
                (c) => c.id === "child2",
            );

            assert.ok(loadedChild1, "child1 should be loaded");
            assert.ok(loadedChild2, "child2 should be loaded");
            assert.strictEqual(
                loadedChild1.children.length,
                1,
                "child1 should have one child",
            );
            assert.strictEqual(
                loadedChild1.children[0].id,
                "grandchild",
                "grandchild should be loaded",
            );
        });

        it("preserves entity components", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const entity = new Entity("entity");
            entity.setEcsComponent({
                id: "testComponent",
                value: 42,
                text: "hello",
            } as any);
            saveRoot.addChild(entity);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            await manager.load(loadRoot);

            const loadedEntity = loadRoot.children[0];
            const component: any = loadedEntity.getEcsComponent(
                "testComponent" as any,
            );

            assert.ok(component, "Component should be loaded");
            assert.strictEqual(component.value, 42);
            assert.strictEqual(component.text, "hello");
        });
    });

    describe("Edge Cases", () => {
        it("returns false when loading non-existent save", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const root = new Entity("root");

            const loaded = await manager.load(root);

            assert.strictEqual(
                loaded,
                false,
                "Should return false for no save",
            );
        });

        it("handles save with no children", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const tileComponent = createTileComponent();
            saveRoot.setEcsComponent(tileComponent);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            const loaded = await manager.load(loadRoot);

            assert.ok(loaded, "Should load save with no entities");
            assert.ok(
                loadRoot.getEcsComponent("Tile"),
                "Root component should be loaded",
            );
            assert.strictEqual(
                loadRoot.children.length,
                0,
                "Root should have no children",
            );
        });

        it("handles save with only entity tree and no root components", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const child = new Entity("child");
            saveRoot.addChild(child);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            const loaded = await manager.load(loadRoot);

            assert.ok(
                loaded,
                "Should load save with entities but no root components",
            );
            assert.strictEqual(
                loadRoot.children.length,
                1,
                "Should load child entity",
            );
        });

        it("serializes and deserializes Maps and Sets", async () => {
            const adapter = new TestAdapter();
            const manager = new PersistenceManager(adapter);
            const saveRoot = new Entity("root");

            const entity = new Entity("entity");
            entity.setEcsComponent({
                id: "mapComponent",
                dataMap: new Map([
                    ["key1", "value1"],
                    ["key2", "value2"],
                ]),
                dataSet: new Set(["item1", "item2", "item3"]),
            } as any);
            saveRoot.addChild(entity);

            await manager.saveWorld(saveRoot);
            await manager.saveMeta({ version: 1, tick: 0, seed: 12345 });

            const loadRoot = new Entity("root");
            await manager.load(loadRoot);

            const loadedEntity = loadRoot.children[0];
            const component: any = loadedEntity.getEcsComponent(
                "mapComponent" as any,
            );

            assert.ok(component, "Component should be loaded");
            assert.ok(
                component.dataMap instanceof Map,
                "dataMap should be a Map",
            );
            assert.ok(
                component.dataSet instanceof Set,
                "dataSet should be a Set",
            );
            assert.strictEqual(component.dataMap.get("key1"), "value1");
            assert.strictEqual(component.dataMap.get("key2"), "value2");
            assert.ok(component.dataSet.has("item1"));
            assert.ok(component.dataSet.has("item2"));
            assert.ok(component.dataSet.has("item3"));
        });
    });
});
