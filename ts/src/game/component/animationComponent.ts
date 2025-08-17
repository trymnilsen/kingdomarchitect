import type {
    AnimationGraph,
    AnimationTemplate,
} from "../../rendering/animation/animationGraph.js";

export type AnimationComponent = {
    id: typeof AnimationComponentId;
    animationGraph: AnimationGraph;
    currentAnimation: string;
};

export function createDirectionComponent(
    animationGraph: AnimationGraph,
): AnimationComponent {
    return {
        id: AnimationComponentId,
        animationGraph,
        currentAnimation: animationGraph.initialState,
    };
}

export const AnimationComponentId = "animation";
