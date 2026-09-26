import assert from "node:assert";
import { describe, it } from "node:test";
import type { Bounds } from "../../../src/common/bounds.ts";
import { isPointAdjacentTo, type Point } from "../../../src/common/point.ts";
import { fishingRodProfile } from "../../../src/data/fishing/fishingProfileDefinition.ts";
import { fishingRodItem } from "../../../src/data/inventory/items/equipment.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import {
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { EquipmentComponentId } from "../../../src/game/component/equipmentComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import {
    getChunk,
    setChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import {
    ChunkSize,
    getChunkPosition,
    terrainIndex,
} from "../../../src/game/map/chunk.ts";
import { Terrain } from "../../../src/game/map/terrain.ts";
import { placeWall } from "../testWorld.ts";
import { ScenarioHarness } from "./scenarioHarness.ts";

// The rim is shore water and the middle tile is open water
const pond: Bounds = { x1: 20, y1: 12, x2: 22, y2: 14 };
// Shore water whose only land neighbour is bank
const shoreSpot: Point = { x: 20, y: 13 };
const bank: Point = { x: 19, y: 13 };
const openWater: Point = { x: 21, y: 13 };

function paintPond(harness: ScenarioHarness, bounds: Bounds): void {
    const tileComponent = harness.root.requireEcsComponent(TileComponentId);
    for (let x = bounds.x1; x <= bounds.x2; x++) {
        for (let y = bounds.y1; y <= bounds.y2; y++) {
            const chunk = getChunk(tileComponent, getChunkPosition(x, y))!;
            const terrain = [...chunk.terrain];
            terrain[
                terrainIndex(
                    x - chunk.chunkX * ChunkSize,
                    y - chunk.chunkY * ChunkSize,
                )
            ] = Terrain.Water;
            setChunk(tileComponent, { ...chunk, terrain });
        }
    }
}

function fisherBesidePond(harness: ScenarioHarness): Entity {
    paintPond(harness, pond);
    const fisher = harness.addWorker("fisher", { x: 13, y: 13 });
    fisher.getEcsComponent(EquipmentComponentId)!.slots.primary =
        fishingRodItem;
    return fisher;
}

// What the HUD sends when the player confirms a spot
function orderFishing(fisher: Entity, spot: Point): void {
    getBehaviorAgent(fisher)!.playerCommand = { action: "fish", target: spot };
    requestReplan(fisher);
}

function isFishing(fisher: Entity): boolean {
    return getBehaviorAgent(fisher)!.actionQueue[0]?.type === "fish";
}

function hasOrder(fisher: Entity): boolean {
    return getBehaviorAgent(fisher)!.playerCommand !== undefined;
}

describe("fishing scenario", () => {
    it("lands the catch on the tick the rod's duration runs out", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);

        orderFishing(fisher, shoreSpot);
        harness.tickUntil(() => isFishing(fisher), 30);
        harness.tickN(fishingRodProfile.duration - 1);

        assert.deepStrictEqual(fisher.worldPosition, bank);
        assert.strictEqual(
            harness.getHeldAmount(fisher, "fish"),
            0,
            "nothing should bite before the duration has passed",
        );

        harness.tick();

        assert.strictEqual(
            harness.getHeldAmount(fisher, "fish"),
            fishingRodProfile.catch.amount,
        );
    });

    it("drops an order into open water without moving", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);
        const start = fisher.worldPosition;

        orderFishing(fisher, openWater);
        harness.tickN(3);

        assert.strictEqual(hasOrder(fisher), false);
        assert.deepStrictEqual(fisher.worldPosition, start);
    });

    it("drops an order into water something is built over", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);
        const start = fisher.worldPosition;
        placeWall(harness.root, shoreSpot);

        orderFishing(fisher, shoreSpot);
        harness.tickN(3);

        assert.strictEqual(hasOrder(fisher), false);
        assert.deepStrictEqual(fisher.worldPosition, start);
    });

    it("drops the order when no one can reach the bank", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);
        // The spot's only bank tile, walled in on its three land sides
        placeWall(harness.root, { x: bank.x - 1, y: bank.y });
        placeWall(harness.root, { x: bank.x, y: bank.y - 1 });
        placeWall(harness.root, { x: bank.x, y: bank.y + 1 });

        orderFishing(fisher, shoreSpot);
        const ticks = harness.tickUntil(() => !hasOrder(fisher), 40);

        assert.strictEqual(
            hasOrder(fisher),
            false,
            `still ordered after ${ticks} ticks`,
        );
        assert.strictEqual(harness.getHeldAmount(fisher, "fish"), 0);
    });

    it("gives up when the rod is unequipped mid-cast", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);

        orderFishing(fisher, shoreSpot);
        harness.tickUntil(() => isFishing(fisher), 30);
        harness.tick();
        fisher.getEcsComponent(EquipmentComponentId)!.slots.primary = null;
        harness.tickN(fishingRodProfile.duration + 2);

        assert.strictEqual(harness.getHeldAmount(fisher, "fish"), 0);
        assert.strictEqual(hasOrder(fisher), false);
    });

    it("sets down what it carries to free its hands, then fishes", () => {
        const harness = new ScenarioHarness();
        const fisher = fisherBesidePond(harness);
        const carried = 3;
        addToHeldItem(
            fisher.getEcsComponent(HeldItemComponentId)!,
            woodResourceItem,
            carried,
        );

        orderFishing(fisher, shoreSpot);
        harness.tickUntil(() => harness.getHeldAmount(fisher, "fish") > 0, 40);

        const piles = [...harness.root.queryComponents(CollectableComponentId)];
        assert.deepStrictEqual(
            piles.map(([, pile]) =>
                pile.items.map((stack) => [stack.item.id, stack.amount]),
            ),
            [[[woodResourceItem.id, carried]]],
            "the wood should be set down whole, not lost or split",
        );
        assert.strictEqual(
            harness.getHeldAmount(fisher, "fish"),
            fishingRodProfile.catch.amount,
        );
        assert.ok(isPointAdjacentTo(fisher.worldPosition, shoreSpot));
    });
});
