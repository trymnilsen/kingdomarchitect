/**
 * The places keyboard focus can be in. On the HUD focus is a highlighted
 * button. In the world it is the state's selection, so moving focus selects.
 */
export const FocusDomain = {
    Hud: "hud",
    World: "world",
} as const;

export type FocusDomain = (typeof FocusDomain)[keyof typeof FocusDomain];

/**
 * For states that are about something in the world. The keys move what is
 * selected, and the HUD with its actions is a press of the cycle key away.
 */
export const worldFirstFocus: readonly FocusDomain[] = [
    FocusDomain.World,
    FocusDomain.Hud,
];
