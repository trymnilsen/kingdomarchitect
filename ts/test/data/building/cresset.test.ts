import assert from "node:assert";
import { describe, it } from "node:test";
import {
    buildingGlowLightSource,
    cressetLightSource,
} from "../../../src/data/light/lightSourceDefinition.ts";

describe("cresset", () => {
    it("reaches further than the glow every building already has", () => {
        // Every building already claims its own glow, so a cresset that
        // reached no further would add nothing beside one.
        assert.ok(
            cressetLightSource.lightRadius >
                buildingGlowLightSource.lightRadius,
        );
    });
});
