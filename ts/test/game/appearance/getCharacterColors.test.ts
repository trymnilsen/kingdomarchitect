import assert from "node:assert";
import { describe, it } from "node:test";
import { spriteRefs } from "../../../src/asset/sprite.ts";
import {
    archerHatWorn,
    wizardHatWorn,
} from "../../../src/data/appearance/hatAppearance.ts";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import {
    bowItem,
    swordItem,
    wizardHat,
} from "../../../src/data/inventory/items/equipment.ts";
import { getCharacterColors } from "../../../src/game/appearance/getCharacterColors.ts";
import {
    EquipmentSpriteVariantType,
    type CharacterColors,
    type PartBoundsEquipment,
} from "../../../src/rendering/character/characterColors.ts";

function wornOn(part: string): PartBoundsEquipment {
    return {
        attachToPart: part,
        sprite: {
            type: EquipmentSpriteVariantType.Single,
            sprite: spriteRefs.wizard_hat,
            offset: { x: 3, y: 5 },
        },
    };
}

function wornEntries(colors: CharacterColors, part: string) {
    return (colors.Equipment ?? []).filter(
        (e) => "attachToPart" in e && e.attachToPart === part,
    );
}

function heldEntries(colors: CharacterColors, anchor: string) {
    return (colors.Equipment ?? []).filter(
        (e) => "anchor" in e && e.anchor === anchor,
    );
}

describe("getCharacterColors", () => {
    it("draws the blacksmith sword in the hand of the slot holding it", () => {
        const colors = getCharacterColors({
            primary: null,
            secondary: swordItem,
        });

        assert.deepStrictEqual(heldEntries(colors, "LeftHand"), [
            { anchor: "LeftHand", sprite: swordItem.visual.held },
        ]);
        assert.deepStrictEqual(heldEntries(colors, "RightHand"), []);
        assert.strictEqual(colors.Chest, "#424242");
    });

    it("puts the archer hat on whoever carries a bow, from either slot", () => {
        const inPrimary = getCharacterColors({
            primary: bowItem,
            secondary: null,
        });
        const inSecondary = getCharacterColors({
            primary: null,
            secondary: bowItem,
        });

        assert.deepStrictEqual(wornEntries(inPrimary, "Head"), [archerHatWorn]);
        assert.deepStrictEqual(wornEntries(inSecondary, "Head"), [
            archerHatWorn,
        ]);
    });

    it("lets the primary slot win when both slots dress the same part", () => {
        const colors = getCharacterColors({
            primary: bowItem,
            secondary: wizardHat,
        });

        assert.deepStrictEqual(
            wornEntries(colors, "Head"),
            [archerHatWorn],
            "two hats on one head would draw on top of each other",
        );
        assert.notDeepStrictEqual(archerHatWorn, wizardHatWorn);
    });

    it("lets the primary slot win a part color, and keeps colors only the secondary sets", () => {
        const redTunic: InventoryItem = {
            id: "redTunic",
            name: "Red tunic",
            asset: spriteRefs.wizard_hat,
            visual: { partColors: { Chest: "red" } },
        };
        const blueOutfit: InventoryItem = {
            id: "blueOutfit",
            name: "Blue outfit",
            asset: spriteRefs.wizard_hat,
            visual: { partColors: { Chest: "blue", Feet: "green" } },
        };

        const colors = getCharacterColors({
            primary: redTunic,
            secondary: blueOutfit,
        });

        assert.strictEqual(colors.Chest, "red");
        assert.strictEqual(colors.Feet, "green");
    });

    it("applies every visual of an item that has several", () => {
        const leftBoot = wornOn("LeftFoot");
        const rightBoot = wornOn("RightFoot");
        const ceremonialAxe: InventoryItem = {
            id: "ceremonialAxe",
            name: "Ceremonial axe",
            asset: spriteRefs.wizard_hat,
            visual: {
                held: swordItem.visual.held,
                worn: [leftBoot, rightBoot],
                partColors: { Chest: "maroon", Pants: "black" },
            },
        };

        const colors = getCharacterColors({
            primary: ceremonialAxe,
            secondary: null,
        });

        assert.strictEqual(heldEntries(colors, "RightHand").length, 1);
        assert.deepStrictEqual(wornEntries(colors, "LeftFoot"), [leftBoot]);
        assert.deepStrictEqual(wornEntries(colors, "RightFoot"), [rightBoot]);
        assert.strictEqual(colors.Chest, "maroon");
        assert.strictEqual(colors.Pants, "black");
    });
});
