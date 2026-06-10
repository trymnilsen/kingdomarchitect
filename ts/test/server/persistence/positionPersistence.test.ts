import assert from "node:assert";
import { describe, it } from "node:test";
import { PersistenceManager } from "../../../src/server/persistence/persistenceManager.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { TestAdapter } from "./testAdapter.ts";
import { assertTransformsConsistent } from "../../game/worldInvariants.ts";

/**
 * Entities persist their world position; loading parents them back together
 * and re-derives local positions. These tests use a nested tree with a
 * non-origin parent so the world-to-local conversion on load is actually
 * exercised — at the origin a broken conversion is indistinguishable from
 * a correct one.
 */
describe("position persistence", () => {
    async function roundTrip(): Promise<Entity> {
        const adapter = new TestAdapter();
        const manager = new PersistenceManager(adapter);
        const saveRoot = new Entity("root");

        const parent = new Entity("parent");
        saveRoot.addChild(parent);
        parent.worldPosition = { x: 4, y: 4 };

        const child = new Entity("child");
        parent.addChild(child);
        child.worldPosition = { x: 7, y: 2 };

        const grandchild = new Entity("grandchild");
        child.addChild(grandchild);
        grandchild.worldPosition = { x: 6, y: 1 };

        await manager.saveWorld(saveRoot);
        await manager.saveMeta({
            version: 1,
            tick: 0,
            seed: 1,
            idCounters: {},
        });

        const loadRoot = new Entity("root");
        const loaded = await manager.load(loadRoot);
        assert.ok(loaded, "should successfully load the save");
        return loadRoot;
    }

    it("restores world positions across a save and load", async () => {
        const loadRoot = await roundTrip();

        assert.deepStrictEqual(loadRoot.findEntity("parent")?.worldPosition, {
            x: 4,
            y: 4,
        });
        assert.deepStrictEqual(loadRoot.findEntity("child")?.worldPosition, {
            x: 7,
            y: 2,
        });
        assert.deepStrictEqual(
            loadRoot.findEntity("grandchild")?.worldPosition,
            { x: 6, y: 1 },
        );
    });

    it("derives local positions consistent with the restored hierarchy", async () => {
        const loadRoot = await roundTrip();

        assert.deepStrictEqual(loadRoot.findEntity("child")?.position, {
            x: 3,
            y: -2,
        });
        assert.deepStrictEqual(loadRoot.findEntity("grandchild")?.position, {
            x: -1,
            y: -1,
        });
        assertTransformsConsistent(loadRoot);
    });
});
