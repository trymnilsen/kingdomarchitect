import type { CharacterAnimation } from "./animationRecipe.ts";
import { compileTimeline } from "./timelineCompiler.ts";
import { codeDefinedRecipes } from "./characterAnimations.ts";

/**
 * Returns the union of source animations from characterpack and all
 * compiled code-defined animations.
 *
 * Source animations pass through unchanged. Code-defined recipes are compiled
 * against the source animations — recipe-as-base references are resolved
 * recursively by the compiler, so declaration order here does not matter.
 *
 * @param sourceAnimations The animations from characterPartFrames (generated)
 * @returns All animations including compiled code-defined recipes
 */
export function getAllAnimations(
    sourceAnimations: CharacterAnimation[],
): CharacterAnimation[] {
    const allAnimations = [...sourceAnimations];
    for (const recipe of codeDefinedRecipes) {
        allAnimations.push(compileTimeline(recipe, sourceAnimations));
    }
    return allAnimations;
}
