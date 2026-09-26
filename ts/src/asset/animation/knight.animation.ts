import type { AnimationGraph } from "../../rendering/animation/animationGraph.ts";

export const nobleKnightAnimationGraph: AnimationGraph = {
    initialState: "Idle",
    globalTransitions: [
        {
            event: "MOVEMENT",
            target: "Walking",
        },
    ],
    states: {
        Idle: {
            type: "loop",
            animation: "idle_{ordinal}",
        },
        Walking: {
            type: "single",
            animation: "walk_{ordinal}",
        },
        /*
        Attacking: {
            type: "single",
            animation: "attack_{ordinal}",
        },*/
    },
};
