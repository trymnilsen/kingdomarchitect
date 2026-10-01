import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type { ColorPart } from "../../../rendering/character/characterColors.ts";
import { CHARACTER_FRAME } from "../../../rendering/character/characterFrame.ts";

export const LAYOUT = {
    TOP_BAR_HEIGHT: 60,
    LEFT_PANEL_WIDTH: 210,
    RIGHT_PANEL_WIDTH: 250,
    LAYER_BOX_SIZE: 100,
    SPRITE_GRID_SIZE: CHARACTER_FRAME.WIDTH * 4,
    COLOR_SWATCH_SIZE: 40,
} as const;

export const COLORS = {
    BACKGROUND_DARK: "rgba(20, 20, 20, 0.9)",
    BACKGROUND_BLACK: "rgba(0, 0, 0, 0.8)",
    DIVIDER: "white",

    PART_BUTTON_DEFAULT: "rgba(50, 50, 50, 0.8)",
    PART_BUTTON_SELECTED: "rgba(100, 150, 100, 0.8)",
    PART_BUTTON_PRESSED: "rgba(70, 120, 70, 0.8)",
    PART_BUTTON_BORDER: "rgba(100, 100, 100, 1)",
    PART_BUTTON_BORDER_SELECTED: "rgba(150, 200, 150, 1)",

    PRIMARY_BUTTON_DEFAULT: "rgba(50, 100, 150, 0.8)",
    PRIMARY_BUTTON_SELECTED: "rgba(70, 130, 180, 0.8)",
    PRIMARY_BUTTON_PRESSED: "rgba(30, 70, 120, 0.8)",
    PRIMARY_BUTTON_BORDER: "rgba(100, 150, 200, 1)",
    PRIMARY_BUTTON_BORDER_SELECTED: "rgba(120, 180, 230, 1)",
    PRIMARY_BUTTON_DISABLED: "rgba(40, 40, 40, 0.5)",
    PRIMARY_BUTTON_DISABLED_BORDER: "rgba(60, 60, 60, 0.7)",

    DANGER_BUTTON_FILL: "rgba(150, 50, 50, 0.8)",
    DANGER_BUTTON_PRESSED: "rgba(50, 0, 50, 0.8)",
    DANGER_BUTTON_BORDER: "rgba(200, 0, 100, 1)",
    DANGER_BUTTON_BORDER_PRESSED: "rgba(100, 10, 50, 1)",

    LAYER_BOX_FILL: "rgba(50, 50, 50, 0.8)",
    LAYER_BOX_BORDER: "rgba(100, 100, 100, 1)",
} as const;

export const COLOR_PARTS: readonly ColorPart[] = [
    "Chest",
    "Feet",
    "Hands",
    "Pants",
];

/** The menu entries: one per colorable part, then the hat and slot pickers. */
export type BuilderSection = ColorPart | "Hat" | "Equipment";

export const BUILDER_SECTIONS: readonly BuilderSection[] = [
    ...COLOR_PARTS,
    "Hat",
    "Equipment",
];

export type SlotOption = {
    slot: EquipmentSlot;
    name: string;
};

export const SLOT_OPTIONS: readonly SlotOption[] = [
    { slot: "primary", name: "Primary (right hand)" },
    { slot: "secondary", name: "Secondary (left hand)" },
];

export const FANTASY_GEAR_COLORS = [
    "DarkSlateBlue",
    "Indigo",
    "DarkViolet",
    "DarkGreen",
    "ForestGreen",
    "OliveDrab",
    "DarkGray",
    "DimGray",
    "DarkSlateGray",
    "MidnightBlue",
    "SteelBlue",
    "Teal",
] as const;

export type PreviewMode = "Sheet" | "Single";
