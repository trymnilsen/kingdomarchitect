import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "../scenario/scenarioHarness.ts";
import { SpecialRequirement } from "../../../src/data/building/building.ts";
import { workshop } from "../../../src/data/building/stone/workshop.ts";
import { carpenter } from "../../../src/data/building/wood/carpenter.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { gemResource } from "../../../src/data/inventory/items/resources.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import {
    RoleComponentId,
    WorkerRole,
} from "../../../src/game/component/worker/roleComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { checkSpecialRequirement } from "../../../src/game/building/specialRequirementQuery.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";

describe("special building requirements", () => {
    it("needs a devotee on the payroll for consecration", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        // Parented to the kingdom rather than the root, so the query sees it
        // as one of the settlement's own people.
        const worker = workerPrefab("worker");
        kingdom.addChild(worker);
        worker.worldPosition = { x: 14, y: 9 };

        assert.strictEqual(
            checkSpecialRequirement(
                kingdom,
                SpecialRequirement.DevoteeConsecration,
            ),
            false,
        );

        worker.requireEcsComponent(RoleComponentId).role = WorkerRole.Devotee;

        assert.strictEqual(
            checkSpecialRequirement(
                kingdom,
                SpecialRequirement.DevoteeConsecration,
            ),
            true,
        );
    });

    it("needs a finished workshop for skilled carving", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();

        // A different building does not count, and neither does a workshop that
        // is still scaffolding: nobody has been taught to carve in it yet.
        harness.addPlayerBuilding(kingdom, carpenter, { x: 12, y: 8 }, "carp");
        harness.addPlayerBuilding(
            kingdom,
            workshop,
            { x: 15, y: 8 },
            "site",
            true,
        );

        assert.strictEqual(
            checkSpecialRequirement(kingdom, SpecialRequirement.SkilledCarving),
            false,
        );

        harness.addPlayerBuilding(kingdom, workshop, { x: 18, y: 8 }, "shop");

        assert.strictEqual(
            checkSpecialRequirement(kingdom, SpecialRequirement.SkilledCarving),
            true,
        );
    });

    it("needs a focus item held in a stockpile, not merely any stock", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        const store = harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 13, y: 11 },
            "store",
        );
        const inventory = store.requireEcsComponent(InventoryComponentId);

        addInventoryItem(inventory, woodResourceItem, 50);
        assert.strictEqual(
            checkSpecialRequirement(
                kingdom,
                SpecialRequirement.MagicalFocusItem,
            ),
            false,
        );

        addInventoryItem(inventory, gemResource, 1);
        assert.strictEqual(
            checkSpecialRequirement(
                kingdom,
                SpecialRequirement.MagicalFocusItem,
            ),
            true,
        );
    });
});
