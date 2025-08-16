import type {
    AnimationClip,
    AnimationGraph,
    AnimationTemplate,
} from "../../rendering/animation/animationGraph.js";

type CurrentAnimation = {
    state: string;
    frame: number;
};

export type AnimationComponent = {
    id: typeof AnimationComponentId;
    animationGraph: AnimationGraph;
    currentAnimation: CurrentAnimation;
};

export function createDirectionComponent(
    animationGraph: AnimationGraph,
): AnimationComponent {
    const initialState: CurrentAnimation = {
        state: animationGraph.initialState,
        frame: 0,
    };
    return {
        id: AnimationComponentId,
        animationGraph,
        currentAnimation: initialState,
    };
}

export const AnimationComponentId = "animation";
