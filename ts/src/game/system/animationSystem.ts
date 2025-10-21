import type { Sprite2 } from "../../asset/sprite.js";
import { Direction } from "../../common/direction.js";
import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { checkAdjacency } from "../../common/point.js";
import {
    isEventTransition,
    type AnimationGraph,
    type AnimationState,
    type AnimationTemplate,
    type ValidAnimationKey,
} from "../../rendering/animation/animationGraph.js";
import { DrawMode } from "../../rendering/drawMode.js";
import type { RenderScope } from "../../rendering/renderScope.js";
import type {
    GameMessage,
    TransformGameMessage,
} from "../../server/message/gameMessage.js";
import {
    AnimationComponentId,
    type AnimationComponent,
} from "../component/animationComponent.js";
import { DirectionComponentId } from "../component/directionComponent.js";
import {
    SpriteComponentId,
    type SpriteComponent,
} from "../component/spriteComponent.js";
import type { Entity } from "../entity/entity.js";

export const animationSystem: EcsSystem = {
    onRender,
    onGameMessage,
};

function onRender(
    root: Entity,
    renderTick: number,
    _renderScope: RenderScope,
    drawMode: DrawMode,
) {
    if (drawMode === DrawMode.Gesture) return;

    const animatables = root.queryComponents(AnimationComponentId);
    for (const [entity, animatable] of animatables) {
        updateAnimatable(entity, renderTick, animatable);
    }
}

function onGameMessage(root: Entity, message: GameMessage) {
    //Check transforms for movement
    //Check effects
    if (message.type == "transform") {
        const entity = root.findEntity(message.entity);
        if (!entity) return;
        const animatable = entity.getEcsComponent(AnimationComponentId);
        if (!animatable) return;
        if (!checkAdjacency(message.oldPosition, message.position)) return;

        const nextStateKey = animatable.animationGraph.globalTransitions.find(
            (transition) =>
                isEventTransition(transition) && transition.event == "MOVEMENT",
        )?.target;

        if (!nextStateKey) return;

        updateAnimation(entity, animatable, nextStateKey);
    }

    if (message.type == "effect") {
        console.log("Effect game messages not supported yet");
    }
}

/**
 * Update the animation logic for a single entity for the current frame.
 * It advances the frame counter or transitions to a new state if the current animation has finished.
 * @param entity The entity being animated.
 * @param animatable The AnimationComponent instance for the entity.
 */
function updateAnimatable(
    entity: Entity,
    renderTick: number,
    animatable: AnimationComponent,
): void {
    const { currentAnimation, animationGraph } = animatable;
    const spriteComponent = entity.requireEcsComponent(SpriteComponentId);
    const sprite = spriteComponent.sprite;

    const currentAnimationState = animationGraph.states[currentAnimation];
    const speed = currentAnimationState.speed ?? 1;
    let nextFrame = spriteComponent.frame;
    if (renderTick % speed === 0) {
        nextFrame = spriteComponent.frame + 1;
    }

    if (nextFrame < sprite.defintion.frames) {
        spriteComponent.frame = nextFrame;
    } else {
        // The animation has finished, decide what to do next.
        let nextStateKey: string;

        if (currentAnimationState.type === "loop") {
            // For looping animations, the next state is the same state.
            nextStateKey = currentAnimation;
        } else {
            // For non-looping animations, find the next state.
            const endTransition = currentAnimationState.transitions?.find(
                (t) => isEventTransition(t) && t.event === "animation_end",
            );
            nextStateKey = endTransition
                ? endTransition.target
                : animationGraph.initialState;
        }

        // Transition to the next animation state.
        updateAnimation(entity, animatable, nextStateKey);
    }
}

function updateAnimation(
    entity: Entity,
    animatable: AnimationComponent,
    nextStateKey: string,
) {
    animatable.currentAnimation = nextStateKey;
    const spriteComponent = entity.updateComponent(
        SpriteComponentId,
        (component) => {
            const sprite = getSpriteForState(animatable, nextStateKey, entity);
            component.sprite = sprite;
            component.frame = 0;
        },
    );
}

/**
 * Replaces placeholders like {direction} in a template string with
 * actual values from an entity's components.
 * @param template The animation template string (e.g., "walk_{direction}").
 * @param entity The entity to get contextual data from.
 * @returns The final animation key (e.g., "walk_down").
 */
function resolvePlaceholders(
    template: AnimationTemplate,
    entity: Entity,
): ValidAnimationKey {
    // Start with the template string
    let resolvedString = template as string;

    // Check for and replace the {direction} placeholder
    if (resolvedString.includes("{direction}")) {
        const direction =
            entity.getEcsComponent(DirectionComponentId)?.direction ??
            Direction.Down;
        resolvedString = resolvedString.replace("{direction}", direction);
    }

    // We cast back to ValidAnimationKey because our type system guarantees
    // that a valid template will resolve to a valid key.
    return resolvedString as ValidAnimationKey;
}

/**
 * A utility to resolve a state name into a concrete sprite.
 * It centralizes the logic for looking up the state, resolving placeholders in the template,
 * and validating that the final sprite exists.
 * @param animatable The AnimationComponent containing the animation graph.
 * @param stateName The key of the state to resolve (e.g., "walking").
 * @param entity The entity, required for resolving placeholders like `{direction}`.
 * @throws Throws an error if the state key is invalid or the resolved sprite name doesn't exist.
 */
function getSpriteForState(
    animatable: AnimationComponent,
    stateName: string,
    entity: Entity,
): Sprite2 {
    const { animationGraph } = animatable;

    const animationState = animationGraph.states[stateName];
    if (!animationState) {
        throw new Error(`Invalid animation state key: "${stateName}"`);
    }

    const animationTemplate = animationState.animation;
    const resolvedSpriteName = resolvePlaceholders(animationTemplate, entity);
    const sprite = animationGraph.animationSet[resolvedSpriteName];

    if (!sprite) {
        throw new Error(
            `Animation state "${stateName}" resolved to "${resolvedSpriteName}", which is not a valid sprite.`,
        );
    }

    return sprite;
}
