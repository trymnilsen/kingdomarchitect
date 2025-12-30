import type {
    AnimationGraph,
    AnimationTemplate,
} from "../../rendering/animation/animationGraph.ts";

export type AnimationComponent = {
    id: typeof AnimationComponentId;
    animationGraph: AnimationGraph;
    currentAnimation: string;
};

export function createAnimationComponent(
    animationGraph: AnimationGraph,
): AnimationComponent {
    return {
        id: AnimationComponentId,
        animationGraph,
        currentAnimation: animationGraph.initialState,
    };
}

export const AnimationComponentId = "animation";
