import assert from "node:assert";
import { describe, it } from "node:test";
import { treeResource } from "../../../src/data/inventory/items/naturalResource.ts";
import { hasLineOfSight } from "../../../src/game/combat/lineOfSight.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { addBuilding, addResource, createMinimalWorld } from "../testWorld.ts";

describe("lineOfSight", () => {
    it("sees diagonally across open ground", () => {
        const { root } = createMinimalWorld();

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 9 }, { x: 13, y: 13 }),
            true,
        );
    });

    it("is blocked by a building standing between the two tiles", () => {
        const { root } = createMinimalWorld();
        addBuilding(root, "granary", { x: 11, y: 11 });

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 11 }, { x: 14, y: 11 }),
            false,
        );
    });

    it("gives the same answer whichever end the shot is traced from", () => {
        // The line runs exactly through the corner between (10,10) and (10,11),
        // so an unordered trace rounds into a different one from each end. With
        // a wall on only one, the two ends would disagree
        const { root } = createMinimalWorld();
        const from = { x: 9, y: 10 };
        const to = { x: 11, y: 11 };
        addBuilding(root, "wall", { x: 10, y: 11 });

        assert.strictEqual(
            hasLineOfSight(root, from, to),
            false,
            "the wall the canonical trace runs into has to block",
        );
        assert.strictEqual(
            hasLineOfSight(root, to, from),
            false,
            "an archer who can hit someone that cannot shoot back is a bug",
        );
    });

    it("is blocked by a standing tree", () => {
        const { root } = createMinimalWorld();
        addResource(root, treeResource, { x: 11, y: 11 });

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 11 }, { x: 14, y: 11 }),
            false,
            "a tree is passable to a worker with an axe but not to an arrow",
        );
    });

    it("is not blocked by another unit standing in the way", () => {
        const { root } = createMinimalWorld();
        const bystander = workerPrefab("bystander");
        root.addChild(bystander);
        bystander.worldPosition = { x: 11, y: 11 };

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 11 }, { x: 14, y: 11 }),
            true,
            "a line of workers is not a wall",
        );
    });

    it("ignores what stands on the two end tiles", () => {
        const { root } = createMinimalWorld();
        addBuilding(root, "tower", { x: 9, y: 11 });
        addBuilding(root, "target", { x: 12, y: 11 });

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 11 }, { x: 12, y: 11 }),
            true,
        );
    });

    it("always sees an adjacent tile, since nothing lies between", () => {
        const { root } = createMinimalWorld();
        addBuilding(root, "wall", { x: 10, y: 11 });

        assert.strictEqual(
            hasLineOfSight(root, { x: 9, y: 11 }, { x: 10, y: 11 }),
            true,
            "melee needs no special case in sight",
        );
    });
});
