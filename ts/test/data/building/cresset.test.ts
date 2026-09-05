import assert from "node:assert";
import { describe, it } from "node:test";
import { getBuildingById } from "../../../src/data/building/buildings.ts";
import {
    buildingGlowLightSource,
    cressetLightSource,
} from "../../../src/data/light/lightSourceDefinition.ts";

describe("cresset", () => {
    it("replaced the torch building rather than living beside it", () => {
        // The building id "torch" is gone. The light definition id "torch"
        // still exists and now belongs to the carried item, so a lingering
        // torch building would resolve to a hand-held light profile.
        assert.strictEqual(getBuildingById("torch"), undefined);
    });

    it("is a placed light pointing at the cresset profile", () => {
        const building = getBuildingById("cresset");

        assert.ok(building, "cresset is registered");
        assert.strictEqual(building.light, cressetLightSource.id);
    });

    it("reaches further than the glow every building already has", () => {
        // Every building already claims its own glow, so a cresset that
        // reached no further would add nothing beside one.
        assert.ok(
            cressetLightSource.lightRadius >
                buildingGlowLightSource.lightRadius,
        );
    });
});
