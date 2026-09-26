import { SPRITE_FRAMES } from "../../asset/sprite.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import type { SpriteDefinitionCache } from "../../devtools/characterbuilder/characterSpriteGenerator.ts";
import { getSpriteForState } from "../appearance/getSpriteForState.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { checkAdjacency } from "../../common/point.ts";
import { isEventTransition } from "../../rendering/animation/animationGraph.ts";
import { DrawMode } from "../../rendering/drawMode.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import type { GameMessage } from "../../server/message/gameMessage.ts";
import {
    AnimationComponentId,
    type AnimationComponent,
} from "../component/animationComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import type { Entity } from "../entity/entity.ts";

export function createAnimationSystem(
    spriteCache: SpriteDefinitionCache,
): EcsSystem {
    return {
        onRender: (root, renderTick, renderScope, drawMode) =>
            onRender(root, renderTick, renderScope, drawMode, spriteCache),
        onGameMessage: (root, message) =>
            onGameMessage(root, message, spriteCache),
    };
}

function onRender(
    root: Entity,
    renderTick: number,
    _renderScope: RenderScope,
    drawMode: DrawMode,
    spriteCache: SpriteDefinitionCache,
) {
    if (drawMode === DrawMode.Gesture) return;

    const animatables = root.queryComponents(AnimationComponentId);
    for (const [entity, animatable] of animatables) {
        updateAnimatable(entity, renderTick, animatable, spriteCache);
    }
}

function onGameMessage(
    root: Entity,
    message: GameMessage,
    spriteCache: SpriteDefinitionCache,
) {
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

        updateAnimation(entity, animatable, nextStateKey, spriteCache);
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
    spriteCache: SpriteDefinitionCache,
): void {
    const { currentAnimation, animationGraph } = animatable;
    const spriteComponent = entity.requireEcsComponent(SpriteComponentId);
    const sprite = spriteRegistry.resolve(spriteComponent.sprite);
    if (!sprite) {
        return;
    }

    const currentAnimationState = animationGraph.states[currentAnimation];
    const speed = currentAnimationState.speed ?? 1;
    let nextFrame = spriteComponent.frame;
    if (renderTick % speed === 0) {
        nextFrame = spriteComponent.frame + 1;
    }

    if (nextFrame < (sprite[SPRITE_FRAMES] ?? 1)) {
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
        updateAnimation(entity, animatable, nextStateKey, spriteCache);
    }
}

function updateAnimation(
    entity: Entity,
    animatable: AnimationComponent,
    nextStateKey: string,
    spriteCache: SpriteDefinitionCache,
) {
    animatable.currentAnimation = nextStateKey;
    entity.updateComponent(SpriteComponentId, (component) => {
        component.sprite = getSpriteForState(
            animatable,
            nextStateKey,
            entity,
            spriteCache,
        );
        component.frame = 0;
    });
}

