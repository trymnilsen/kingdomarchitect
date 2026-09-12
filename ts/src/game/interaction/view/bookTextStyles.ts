import type { TextStyle } from "../../../rendering/text/textStyle.ts";
import { bookInkColor, hiddenBookInkColor } from "../../../ui/color.ts";

/** Body text on a book page. */
export const bookTextStyle: TextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

/** The name of whatever the page is about. */
export const bookTitleStyle: TextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 20,
};

/** Supporting lines: subtitles, descriptions, notes. */
export const bookSubtitleStyle: TextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

/** Body text for something written but not in force, such as an excluded duty. */
export const bookFadedTextStyle: TextStyle = {
    color: hiddenBookInkColor,
    font: "Silkscreen",
    size: 16,
};

/** The faded counterpart of the subtitle style. */
export const bookFadedSubtitleStyle: TextStyle = {
    color: hiddenBookInkColor,
    font: "Silkscreen",
    size: 12,
};
