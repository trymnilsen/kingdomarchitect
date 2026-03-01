import type { AnimationRecipe } from "./animationRecipe.ts";

/**
 * All code-defined animation recipes.
 * Add new recipes here using the timeline() builder.
 * Each recipe is compiled and included in every buildSpriteSheet call.
 *
 * Example:
 *   import { timeline } from "./timelineBuilder.ts";
 *   export const codeDefinedRecipes: AnimationRecipe[] = [
 *     timeline("idle_southeast")
 *       .basedOn("walk_southeast", 0)
 *       .duration(20)
 *       .part("LeftEye", t => t.at(8).hide().at(9).show().at(14).hide().at(15).show())
 *       .part("RightEye", t => t.copyFrom("LeftEye"))
 *       .build(),
 *   ];
 */
export const codeDefinedRecipes: AnimationRecipe[] = [];
