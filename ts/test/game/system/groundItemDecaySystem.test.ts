import assert from "node:assert";
import { describe, it } from "node:test";
import type { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    DECAY_SWEEP_INTERVAL,
    groundItemDecaySystem,
} from "../../../src/game/system/groundItemDecaySystem.ts";
import {
    createGroundItemComponent,
    GROUND_ITEM_DECAY_TICKS,
    GroundItemComponentId,
    groundItemDecayFraction,
} from "../../../src/game/component/groundItemComponent.ts";
import { dropItemAtPosition } from "../../../src/game/behavior/dropItem.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { queryEntity } from "../../../src/game/map/query/queryEntity.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

/** Round a tick up to the next sweep so the system actually runs. */
function nextSweepAfter(tick: number): number {
    return (Math.floor(tick / DECAY_SWEEP_INTERVAL) + 1) * DECAY_SWEEP_INTERVAL;
}

function pileAt(root: Entity, x: number, y: number): Entity | undefined {
    return queryEntity(root, { x, y }).find((entity) =>
        entity.hasComponent(GroundItemComponentId),
    );
}

describe("groundItemDecayFraction", () => {
    it("runs from 0 at the drop to 1 at the end of its life", () => {
        const component = createGroundItemComponent(200);

        assert.strictEqual(groundItemDecayFraction(component, 200), 0);
        assert.strictEqual(
            groundItemDecayFraction(
                component,
                200 + GROUND_ITEM_DECAY_TICKS / 2,
            ),
            0.5,
        );
        assert.strictEqual(
            groundItemDecayFraction(component, 200 + GROUND_ITEM_DECAY_TICKS),
            1,
        );
    });

    it("clamps rather than running past its bounds", () => {
        const component = createGroundItemComponent(200);

        // A pile cannot be more than gone, and a save loaded at an earlier
        // tick must not read as negative decay.
        assert.strictEqual(
            groundItemDecayFraction(
                component,
                200 + GROUND_ITEM_DECAY_TICKS * 3,
            ),
            1,
        );
        assert.strictEqual(groundItemDecayFraction(component, 150), 0);
    });
});

describe("groundItemDecaySystem", () => {
    it("removes a pile once it has lain out its full life", () => {
        const { root, world } = createMinimalWorld();
        world.addSystem(groundItemDecaySystem);

        dropItemAtPosition(
            root,
            0,
            { x: 7, y: 5 },
            woodResourceItem,
            3,
            "test",
        );

        const beforeExpiry = nextSweepAfter(GROUND_ITEM_DECAY_TICKS / 2);
        world.runUpdate(beforeExpiry);
        assert.ok(pileAt(root, 7, 5), "a half-decayed pile is still there");

        world.runUpdate(nextSweepAfter(GROUND_ITEM_DECAY_TICKS));
        assert.strictEqual(pileAt(root, 7, 5), undefined, "the pile rots away");
    });

    it("decays each pile on its own clock", () => {
        const { root, world } = createMinimalWorld();
        world.addSystem(groundItemDecaySystem);

        dropItemAtPosition(
            root,
            0,
            { x: 7, y: 5 },
            woodResourceItem,
            3,
            "test",
        );
        const later = GROUND_ITEM_DECAY_TICKS / 2;
        dropItemAtPosition(root, later, { x: 9, y: 5 }, stoneResource, 3, "t");

        world.runUpdate(nextSweepAfter(GROUND_ITEM_DECAY_TICKS));

        assert.strictEqual(pileAt(root, 7, 5), undefined, "the old pile rots");
        assert.ok(
            pileAt(root, 9, 5),
            "the pile dropped later still has half its life",
        );
    });

    it("starts the clock on a pile saved before decay existed", () => {
        const { root, world } = createMinimalWorld();
        world.addSystem(groundItemDecaySystem);

        dropItemAtPosition(
            root,
            0,
            { x: 7, y: 5 },
            woodResourceItem,
            3,
            "test",
        );
        const pile = pileAt(root, 7, 5)!;
        const groundItem = pile.requireEcsComponent(GroundItemComponentId);
        // A pile loaded from a save written before droppedAtTick existed.
        delete (groundItem as Partial<typeof groundItem>).droppedAtTick;

        const firstSweep = nextSweepAfter(0);
        world.runUpdate(firstSweep);

        assert.ok(pileAt(root, 7, 5), "it is not swept on sight");
        assert.strictEqual(
            groundItem.droppedAtTick,
            firstSweep,
            "its clock starts at the sweep that found it",
        );

        world.runUpdate(nextSweepAfter(firstSweep + GROUND_ITEM_DECAY_TICKS));
        assert.strictEqual(
            pileAt(root, 7, 5),
            undefined,
            "and it then rots on the normal schedule",
        );
    });

    it("gives a topped-up pile its full life again", () => {
        const { root, world } = createMinimalWorld();
        world.addSystem(groundItemDecaySystem);

        dropItemAtPosition(
            root,
            0,
            { x: 7, y: 5 },
            woodResourceItem,
            3,
            "test",
        );
        const topUp = GROUND_ITEM_DECAY_TICKS - 10;
        dropItemAtPosition(
            root,
            topUp,
            { x: 7, y: 5 },
            woodResourceItem,
            2,
            "t",
        );

        world.runUpdate(nextSweepAfter(GROUND_ITEM_DECAY_TICKS));

        const pile = pileAt(root, 7, 5);
        assert.ok(pile, "the refreshed pile survives its original expiry");
        assert.strictEqual(
            pile.requireEcsComponent(CollectableComponentId).items[0].amount,
            5,
        );
    });
});
