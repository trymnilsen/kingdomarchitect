export const DrawMode = {
    Tick: 0,
    Gesture: 1,
} as const;

export type DrawMode = typeof DrawMode[keyof typeof DrawMode];
