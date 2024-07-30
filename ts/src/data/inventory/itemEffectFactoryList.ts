import { healthPotionFactory } from "./effectFactory/healthPotionFactory.js";
import { EffectFactory } from "./itemEffectFactory.js";
import { healthPotion } from "./items/resources.js";

export const itemEffectFactoryList: { [id: string]: EffectFactory } = {
    [healthPotion.id]: healthPotionFactory,
};
