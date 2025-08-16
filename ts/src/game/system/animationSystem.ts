import { Direction } from "../../common/direction.js";
import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { checkAdjacency } from "../../common/point.js";
import {
    isEventTransition,
    type AnimationClip,
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
import type { Entity } from "../entity/entity.js";

export const animationSystem: EcsSystem = {
    onRender,
    onGameMessage,
};

function onRender(root: Entity, _renderScope: RenderScope, drawMode: DrawMode) {
    if (drawMode === DrawMode.Gesture) return;

    const animatables = root.queryComponents(AnimationComponentId);
    for (const [entity, animatable] of animatables) {
        updateAnimatable(entity, animatable);
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
                isEventTransition(transition) && transition.event == "movement",
        )?.target;

        if (!nextStateKey) return;

        const animationClip = getAnimationClip(
            animatable,
            nextStateKey,
            entity,
        );

        animatable.currentAnimation.frame = 0;
        animatable.currentAnimation.state = nextStateKey;
        animatable.currentAnimation.clip = animationClip;
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
    animatable: AnimationComponent,
): void {
    const { currentAnimation, animationGraph } = animatable;
    const currentAnimationState = animationGraph.states[currentAnimation.state];
    const animationClip = getAnimationClip(
        animatable,
        currentAnimation.state,
        entity,
    );

    const nextFrame = currentAnimation.frame + 1;

    if (nextFrame < animationClip.sprite.defintion.frames) {
        currentAnimation.frame = nextFrame;
    } else {
        handleAnimationEnd(
            entity,
            animatable,
            currentAnimationState,
            animationClip,
        );
    }
}

/**
 * Handles the logic when an animation clip finishes playing.
 * It will either loop the animation or find and transition to a new state.
 * @param entity the entity to animate
 * @param animatable The entity's AnimationComponent.
 * @param currentAnimationState The state object of the animation that just finished.
 * @param animationClip The clip data of the animation that just finished.
 */
function handleAnimationEnd(
    entity: Entity,
    animatable: AnimationComponent,
    currentAnimationState: AnimationState,
    animationClip: AnimationClip,
): void {
    const { currentAnimation } = animatable;

    if (animationClip.type === "loop") {
        currentAnimation.frame = 0;
    } else {
        const nextStateKey = findNextStateKeyOnEnd(
            animatable,
            currentAnimationState,
        );

        animatable.currentAnimation.frame = 0;
        animatable.currentAnimation.state = nextStateKey;
        animatable.currentAnimation.clip = getAnimationClip(
            animatable,
            nextStateKey,
            entity,
        );
    }
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
 * A utility to resolve a state name into a concrete AnimationClip.
 * It centralizes the logic for looking up the state, resolving placeholders in the template,
 * and validating that the final clip exists.
 * @param {AnimationComponent} animatable The AnimationComponent containing the animation graph.
 * @param {string} stateName The key of the state to resolve (e.g., "walking").
 * @param {Entity} entity The entity, required for resolving placeholders like `{direction}`.
 * @returns {AnimationClip} The resolved and validated animation clip.
 * @throws {Error} Throws an error if the state key is invalid or the resolved clip name doesn't exist.
 */
function getAnimationClip(
    animatable: AnimationComponent,
    stateName: string,
    entity: Entity,
): AnimationClip {
    const { animationGraph } = animatable;

    const animationState = animationGraph.states[stateName];
    if (!animationState) {
        throw new Error(`Invalid animation state key: "${stateName}"`);
    }

    const animationTemplate = animationState.animation;
    const resolvedClipName = resolvePlaceholders(animationTemplate, entity);
    const animationClip = animationGraph.animationSet[resolvedClipName];

    if (!animationClip) {
        throw new Error(
            `Animation state "${stateName}" resolved to "${resolvedClipName}", which is not a valid clip.`,
        );
    }

    return animationClip;
}

/**
 * Finds the key of the next animation state after a non-looping animation concludes.
 * It looks for an "animation_end" transition, otherwise defaults to the graph's initial state.
 * @param {AnimationComponent} animatable The AnimationComponent containing the animation graph.
 * @param {AnimationState} currentAnimationState The state object of the animation that just finished.
 * @returns {string} The key of the next animation state to transition to.
 */
function findNextStateKeyOnEnd(
    animatable: AnimationComponent,
    currentAnimationState: AnimationState,
): string {
    const { animationGraph } = animatable;

    const endTransition = currentAnimationState.transitions?.find(
        (t) => isEventTransition(t) && t.event === "animation_end",
    );

    if (endTransition) {
        return endTransition.target;
    }

    return animationGraph.initialState;
}
