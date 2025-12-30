export const bookInkColor = "#1B2236";
export const bookFill = "#EEBD8A";
export const stoneFill = "#858585";
export const hiddenBookInkColor = "#B87A4B";
export const redColor = "#FF0000";

export const UIThemeType = {
    Book: 0,
    Stone: 1,
} as const;

export type UIThemeType = typeof UIThemeType[keyof typeof UIThemeType];
