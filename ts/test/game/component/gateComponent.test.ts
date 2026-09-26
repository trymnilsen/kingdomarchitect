import assert from "node:assert";
import { describe, it } from "node:test";
import { gate } from "../../../src/data/building/stone/gate.ts";
import { setGateOpen } from "../../../src/game/component/gateComponent.ts";
import { isImpassableStructure } from "../../../src/game/component/traversalComponent.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";

describe("gate", () => {
    it("blocks raiders and workers alike, holding no notion of who may pass", () => {
        // The whole design rests on there being one answer per state rather
        // than a per-faction one. isImpassableStructure takes no actor, so a
        // shut gate cannot be walked through by anybody.
        const entity = buildingPrefab(gate, false);
        assert.strictEqual(isImpassableStructure(entity), true);

        setGateOpen(entity, true);
        assert.strictEqual(isImpassableStructure(entity), false);
    });
});
