import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { cresset } from "../../../src/data/building/light/cresset.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import { WorkerRole } from "../../../src/game/component/worker/roleComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
    setHeldItem,
} from "../../../src/game/component/heldItemComponent.ts";
import {
    CollectableComponentId,
    createCollectableComponent,
} from "../../../src/game/component/collectableComponent.ts";
import {
    createGroundItemComponent,
    GroundItemComponentId,
} from "../../../src/game/component/groundItemComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import { StockpileComponentId } from "../../../src/game/component/stockpileComponent.ts";
import { setRoles } from "../behavior/behaviorTestHelpers.ts";

const STORE = { x: 18, y: 12 };

/** A lit yard with one stockpile and one worker who only hauls. */
function haulingYard(haulerAt: Point): {
    harness: ScenarioHarness;
    store: Entity;
    hauler: Entity;
} {
    const harness = new ScenarioHarness([pathfindingSystem]);
    const kingdom = harness.addPlayerKingdom();
    harness.addPlayerBuilding(kingdom, cresset, { x: 16, y: 12 }, "light");
    const store = harness.addStockpile("store", STORE);
    const hauler = harness.addWorker("hauler", haulerAt);
    setRoles(hauler, [WorkerRole.Hauler]);
    return { harness, store, hauler };
}

function addWoodPile(harness: ScenarioHarness, position: Point): Entity {
    const pile = new Entity("pile");
    pile.setEcsComponent(
        createCollectableComponent([{ item: woodResourceItem, amount: 3 }]),
    );
    pile.setEcsComponent(createGroundItemComponent(0));
    harness.root.addChild(pile);
    pile.worldPosition = position;
    return pile;
}

function woodOnTheGround(root: Entity): number {
    let total = 0;
    for (const [pile] of root.queryComponents(GroundItemComponentId)) {
        const collectable = pile.getEcsComponent(CollectableComponentId);
        for (const stack of collectable?.items ?? []) {
            if (stack.item.id === woodResourceItem.id) total += stack.amount;
        }
    }
    return total;
}

/** Fill the store to its capacity with stone, so it accepts nothing more. */
function fillWithStone(store: Entity): void {
    const capacity = store.requireEcsComponent(StockpileComponentId).capacity;
    addInventoryItem(
        store.requireEcsComponent(InventoryComponentId),
        stoneResource,
        capacity,
    );
}

describe("hauling a pile the hauler stands on", () => {
    it("picks up the pile underfoot and delivers it", () => {
        // The save that prompted this had haulers standing on their piles,
        // flickering between a failed pickup and idle forever
        const { harness, store, hauler } = haulingYard({ x: 16, y: 13 });
        addWoodPile(harness, { x: 16, y: 13 });

        harness.tickUntil(
            () => harness.getItemCount(store, woodResourceItem.id) >= 3,
            40,
        );

        assert.strictEqual(
            harness.getItemCount(store, woodResourceItem.id),
            3,
            "the pile reached the store",
        );
        assert.strictEqual(woodOnTheGround(harness.root), 0);
        assert.ok(isHeldEmpty(hauler.requireEcsComponent(HeldItemComponentId)));
    });

    it("recovers a load it had to drop while the store was full", () => {
        const { harness, store, hauler } = haulingYard({ x: 17, y: 14 });
        fillWithStone(store);
        setHeldItem(
            hauler.requireEcsComponent(HeldItemComponentId),
            woodResourceItem,
            3,
        );

        harness.tickUntil(() => woodOnTheGround(harness.root) === 3, 20);
        assert.strictEqual(
            woodOnTheGround(harness.root),
            3,
            "with nowhere to put it the hauler set the wood down",
        );

        // Room frees up, the way it does when a crafter fetches from the store
        takeInventoryItem(
            store.requireEcsComponent(InventoryComponentId),
            stoneResource.id,
            10,
        );

        harness.tickUntil(
            () => harness.getItemCount(store, woodResourceItem.id) >= 3,
            40,
        );

        assert.strictEqual(
            harness.getItemCount(store, woodResourceItem.id),
            3,
            "the dropped wood was picked back up and delivered",
        );
        assert.strictEqual(woodOnTheGround(harness.root), 0);
    });
});
