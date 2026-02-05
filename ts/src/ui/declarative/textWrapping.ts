import type { TextStyle } from "../../rendering/text/textStyle.ts";
import type { UISize } from "./ui.ts";

export type MeasureTextFn = (text: string, style: TextStyle) => UISize;

export type TextOverflow = "overflow" | "truncate";

/**
 * Wraps text into multiple lines that fit within the specified width.
 * Splits on whitespace boundaries.
 */
export function wrapTextToLines(
    text: string,
    maxWidth: number,
    textStyle: TextStyle,
    measureText: MeasureTextFn,
): string[] {
    if (maxWidth <= 0) {
        return [text];
    }

    const singleLineWidth = measureText(text, textStyle).width;
    if (singleLineWidth <= maxWidth) {
        return [text];
    }

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = measureText(testLine, textStyle).width;

        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = fitWordToWidth(word, maxWidth, textStyle, measureText);
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}

function fitWordToWidth(
    word: string,
    maxWidth: number,
    textStyle: TextStyle,
    measureText: MeasureTextFn,
): string {
    const wordWidth = measureText(word, textStyle).width;
    if (wordWidth <= maxWidth) {
        return word;
    }
    return word;
}

/**
 * Calculates which lines should be visible given the available height.
 * When truncating, adds an ellipsis to the last visible line.
 */
export function calculateVisibleLines(
    lines: string[],
    lineHeight: number,
    availableHeight: number,
    overflow: TextOverflow,
): string[] {
    if (overflow === "overflow") {
        return lines;
    }

    const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));
    if (lines.length <= maxLines) {
        return lines;
    }

    const truncatedLines = lines.slice(0, maxLines);
    const lastIndex = truncatedLines.length - 1;
    if (truncatedLines[lastIndex]) {
        truncatedLines[lastIndex] = truncatedLines[lastIndex] + "…";
    }

    return truncatedLines;
}

/**
 * Measures the total size of wrapped text lines.
 */
export function measureWrappedText(
    lines: string[],
    lineHeight: number,
    measureText: MeasureTextFn,
    textStyle: TextStyle,
): UISize {
    let maxWidth = 0;
    for (const line of lines) {
        const lineWidth = measureText(line, textStyle).width;
        maxWidth = Math.max(maxWidth, lineWidth);
    }

    return {
        width: maxWidth,
        height: lines.length * lineHeight,
    };
}

/**
 * Measures the height of a line of text.
 */
export function measureLineHeight(
    textStyle: TextStyle,
    measureText: MeasureTextFn,
): number {
    return measureText("Mg", textStyle).height;
}
