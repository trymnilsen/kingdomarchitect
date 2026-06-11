import assert from "node:assert";
import { describe, it } from "node:test";
import {
    enchanterRecipes,
    greaterHealthPotionRecipe,
    healthPotionRecipe,
} from "../../../src/data/crafting/recipes/enchanterRecipes.ts";
import { itemEffectFactoryList } from "../../../src/data/inventory/itemEffectFactoryList.ts";
import {
    berryItem,
    goldCoins,
    greaterHealthPotion,
    healthPotion,
    mushroomFoodItem,
} from "../../../src/data/inventory/items/resources.ts";

describe("enchanterRecipes", () => {
    it("brews health potions from forage", () => {
        assert.deepStrictEqual(healthPotionRecipe.inputs, [
            { item: berryItem, amount: 3 },
            { item: mushroomFoodItem, amount: 1 },
        ]);
        assert.deepStrictEqual(healthPotionRecipe.outputs, [
            { item: healthPotion, amount: 2 },
        ]);
        assert.strictEqual(healthPotionRecipe.duration, 5);
    });

    it("refines a health potion with gold into a greater one", () => {
        assert.deepStrictEqual(greaterHealthPotionRecipe.inputs, [
            { item: healthPotion, amount: 1 },
            { item: goldCoins, amount: 2 },
        ]);
        assert.deepStrictEqual(greaterHealthPotionRecipe.outputs, [
            { item: greaterHealthPotion, amount: 1 },
        ]);
        assert.strictEqual(greaterHealthPotionRecipe.duration, 5);
    });

    it("contains both potion recipes", () => {
        assert.deepStrictEqual(enchanterRecipes, [
            healthPotionRecipe,
            greaterHealthPotionRecipe,
        ]);
    });

    it("both potions have immediate heal effects of the right size", () => {
        const lesser = itemEffectFactoryList[healthPotion.id](healthPotion);
        assert.strictEqual(lesser.timing.type, "immediate");
        assert.strictEqual((lesser.data as { amount: number }).amount, 50);

        const greater =
            itemEffectFactoryList[greaterHealthPotion.id](greaterHealthPotion);
        assert.strictEqual(greater.timing.type, "immediate");
        assert.strictEqual((greater.data as { amount: number }).amount, 150);
    });
});
