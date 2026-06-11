import { greaterHealthPotionFactory } from "./effectFactory/greaterHealthPotionFactory.ts";
import { healthPotionFactory } from "./effectFactory/healthPotionFactory.ts";
import type { EffectFactory } from "./itemEffectFactory.ts";
import { greaterHealthPotion, healthPotion } from "./items/resources.ts";

export const itemEffectFactoryList: { [id: string]: EffectFactory } = {
    [healthPotion.id]: healthPotionFactory,
    [greaterHealthPotion.id]: greaterHealthPotionFactory,
};
