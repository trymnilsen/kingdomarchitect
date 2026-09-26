import { spriteRefs, type SpriteRef } from "../../asset/sprite.ts";
import { Direction, OrdinalDirection } from "../../common/direction.ts";
import { getCharacterBinId } from "../../devtools/characterbuilder/characterBinId.ts";
import type { SpriteDefinitionCache } from "../../devtools/characterbuilder/characterSpriteGenerator.ts";
import type {
    AnimationKey,
    AnimationTemplate,
} from "../../rendering/animation/animationGraph.ts";
import type { AnimationComponent } from "../component/animationComponent.ts";
import { DirectionComponentId } from "../component/directionComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { getCharacterColors } from "./getCharacterColors.ts";

/**
 * Resolves a state name into a concrete sprite
 * @param animatable AnimationComponent containing the animation graph
 * @param stateName key of the state to resolve eg "walking"
 * @param entity The entity animated, required for resolving placeholders like `{direction}`
 * @throws Throws Error if the state key is invalid or the resolved sprite name doesn't exist
 */
export function getSpriteForState(
    animatable: AnimationComponent,
    stateName: string,
    entity: Entity,
    spriteCache: SpriteDefinitionCache,
): SpriteRef {
    const { animationGraph } = animatable;

    const animationState = animationGraph.states[stateName];
    if (!animationState) {
        throw new Error(`Invalid animation state key: "${stateName}"`);
    }

    const animationTemplate = animationState.animation;
    const animationName = resolvePlaceholders(animationTemplate, entity);
    if (animationName in spriteRefs) {
        return spriteRefs[animationName as keyof typeof spriteRefs];
    } else if (entity.hasComponent(EquipmentComponentId)) {
        const equipment = entity.requireEcsComponent(EquipmentComponentId);
        const colors = getCharacterColors(equipment);
        const characterId = getCharacterBinId(colors);
        // Get the SpriteRef from the cache (sprites are registered with spriteRegistry)
        const sprite = spriteCache.getSpriteFor(characterId, animationName);
        return sprite;
    } else {
        throw new Error(
            `Animation state "${stateName}" resolved to "${animationName}", which is not a valid animation.`,
        );
    }
}

function resolvePlaceholders(
    template: AnimationTemplate,
    entity: Entity,
): AnimationKey {
    let resolvedString = template as string;

    if (resolvedString.includes("{direction}")) {
        const direction =
            entity.getEcsComponent(DirectionComponentId)?.direction ??
            Direction.Down;
        resolvedString = resolvedString.replace("{direction}", direction);
    }

    if (resolvedString.includes("{ordinal}")) {
        const ordinal =
            entity.getEcsComponent(DirectionComponentId)?.ordinal ??
            OrdinalDirection.Northeast;
        resolvedString = resolvedString.replace("{ordinal}", ordinal);
    }

    // A valid template always resolves to a valid key, which the types cannot
    // express through the string replacement.
    return resolvedString as AnimationKey;
}
