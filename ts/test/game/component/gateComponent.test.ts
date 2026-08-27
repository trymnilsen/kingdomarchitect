import assert from "node:assert";
import { describe, it } from "node:test";
import { spriteRefs } from "../../../src/asset/sprite.ts";
import { gate } from "../../../src/data/building/stone/gate.ts";
import {
    GateComponentId,
    setGateOpen,
} from "../../../src/game/component/gateComponent.ts";
import { isImpassableStructure } from "../../../src/game/component/traversalComponent.ts";
import { SpriteComponentId } from "../../../src/game/component/spriteComponent.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";

describe("gate", () => {
    it("starts shut and blocks movement", () => {
        const entity = buildingPrefab(gate, false);

        assert.strictEqual(
            entity.requireEcsComponent(GateComponentId).isOpen,
            false,
        );
        assert.strictEqual(isImpassableStructure(entity), true);
    });

    it("becomes passable when opened and solid again when shut", () => {
        const entity = buildingPrefab(gate, false);

        setGateOpen(entity, true);
        assert.strictEqual(isImpassableStructure(entity), false);

        setGateOpen(entity, false);
        assert.strictEqual(isImpassableStructure(entity), true);
    });

    it("keeps the sprite in step with the state", () => {
        const entity = buildingPrefab(gate, false);

        assert.strictEqual(
            entity.requireEcsComponent(SpriteComponentId).sprite.spriteId,
            spriteRefs.gate_horizontal_closed.spriteId,
        );

        setGateOpen(entity, true);
        assert.strictEqual(
            entity.requireEcsComponent(SpriteComponentId).sprite.spriteId,
            spriteRefs.gate_horizontal.spriteId,
        );
    });

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
