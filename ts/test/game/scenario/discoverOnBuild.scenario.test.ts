import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { brazier } from "../../../src/data/building/wood/brazier.ts";
import { BuildingComponentId } from "../../../src/game/component/buildingComponent.ts";
import { finishConstruction } from "../../../src/game/job/buildBuildingJob.ts";
import {
    hasDiscoveredTile,
    WorldDiscoveryComponentId,
} from "../../../src/game/component/worldDiscoveryComponent.ts";

describe("discover on build", () => {
    it("discovers a light building's full lit footprint, beyond its vision reach", () => {
        const harness = new ScenarioHarness();
        const worldDiscovery = harness.root.requireEcsComponent(
            WorldDiscoveryComponentId,
        );

        // A brazier lights bright 2 / dim 4, but a building only sees 1 tile. The
        // harness does no startup discovery, so the area is undiscovered and any
        // discovery here must come from finishing this building.
        const position = { x: 20, y: 16 };
        const building = buildingPrefab(brazier, true, "brazier");
        harness.root.addChild(building);
        building.worldPosition = position;

        finishConstruction(
            harness.root,
            building,
            building.requireEcsComponent(BuildingComponentId),
        );

        // Four tiles east sits exactly on the dim-radius edge (distSq 16 == dim
        // radius squared) yet is Manhattan distance 4 — far outside the building's
        // vision reach of 1. Discovering it proves the light footprint, not reach,
        // drove discovery.
        assert.ok(
            hasDiscoveredTile(worldDiscovery, "player", { x: 24, y: 16 }),
            "lit tile at the dim-radius edge should be discovered",
        );

        // One tile further is unlit (distSq 25 > 16) and still out of reach, so it
        // must stay undiscovered — the discovered footprint matches the light and
        // nothing beyond it.
        assert.ok(
            !hasDiscoveredTile(worldDiscovery, "player", { x: 25, y: 16 }),
            "tile beyond the light should remain undiscovered",
        );
    });
});
