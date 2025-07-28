export type GameMessage =
    | AddEntityGameMessage
    | SetComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | EffectGameMessage;

export type AddEntityGameMessage = {
    type: "addEntity";
};

export type SetComponentGameMessage = {
    type: "setComponent";
};

export type ComponentDeltaGameMessage = {
    type: "componentDelta";
};

export type TransformGameMessage = {
    type: "transform";
};

export type EffectGameMessage = {
    type: "effect";
};
