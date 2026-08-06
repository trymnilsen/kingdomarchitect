export const LAYOUT = {
    PANEL_WIDTH: 280,
    BUTTON_HEIGHT: 36,
    TICK_BAR_HEIGHT: 48,
    SECTION_GAP: 8,
} as const;

export const COLORS = {
    BACKGROUND_DARK: "rgba(20, 20, 20, 0.9)",
    BACKGROUND_PANEL: "rgba(15, 15, 15, 0.95)",

    BUTTON_DEFAULT: "rgba(50, 100, 150, 0.8)",
    BUTTON_SELECTED: "rgba(70, 130, 180, 0.8)",
    BUTTON_PRESSED: "rgba(30, 70, 120, 0.8)",
    BUTTON_BORDER: "rgba(100, 150, 200, 1)",
    BUTTON_BORDER_SELECTED: "rgba(120, 180, 230, 1)",

    RESET_BUTTON_DEFAULT: "rgba(150, 50, 50, 0.8)",
    RESET_BUTTON_PRESSED: "rgba(100, 20, 20, 0.8)",
    RESET_BUTTON_BORDER: "rgba(200, 80, 80, 1)",

    SECTION_HEADER: "rgba(40, 40, 40, 0.9)",
    SECTION_HEADER_BORDER: "rgba(80, 80, 80, 1)",
} as const;
