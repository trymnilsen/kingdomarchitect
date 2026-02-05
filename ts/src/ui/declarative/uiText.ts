import type { TextStyle } from "../../rendering/text/textStyle.ts";
import { fillUiSize, wrapUiSize } from "../uiSize.ts";
import { createComponent, type UISize } from "./ui.ts";
import {
    wrapTextToLines,
    measureLineHeight,
    measureWrappedText,
    calculateVisibleLines,
    type TextOverflow,
} from "./textWrapping.ts";

export type { TextOverflow } from "./textWrapping.ts";

export type UiTextProps = {
    content: string;
    textStyle: TextStyle;
    width?: number;
    height?: number;
    overflow?: TextOverflow;
};

export const uiText = createComponent<UiTextProps>(
    ({ props, withDraw, measureText, constraints }) => {
        const overflow = props.overflow ?? "overflow";
        const requestedWidth = props.width ?? wrapUiSize;
        const requestedHeight = props.height ?? wrapUiSize;

        const availableWidth = resolveAvailableWidth(
            requestedWidth,
            constraints,
        );
        const availableHeight = resolveAvailableHeight(
            requestedHeight,
            constraints,
        );

        const lines = wrapTextToLines(
            props.content,
            availableWidth,
            props.textStyle,
            measureText,
        );

        const lineHeight = measureLineHeight(props.textStyle, measureText);
        const measuredSize = measureWrappedText(lines, lineHeight, measureText, props.textStyle);

        const visibleLines = calculateVisibleLines(
            lines,
            lineHeight,
            availableHeight,
            overflow,
        );

        withDraw((context, region) => {
            for (let i = 0; i < visibleLines.length; i++) {
                const line = visibleLines[i];
                context.drawScreenspaceText({
                    text: line,
                    font: props.textStyle.font,
                    size: props.textStyle.size,
                    color: props.textStyle.color,
                    x: region.x,
                    y: region.y + i * lineHeight,
                });
            }
        });

        const finalSize = calculateFinalSize(
            requestedWidth,
            requestedHeight,
            measuredSize,
            constraints,
        );

        return {
            children: [],
            size: finalSize,
        };
    },
);

function resolveAvailableWidth(requestedWidth: number, constraints: UISize): number {
    if (requestedWidth === fillUiSize) {
        return constraints.width;
    }
    if (requestedWidth === wrapUiSize) {
        return constraints.width;
    }
    return requestedWidth;
}

function resolveAvailableHeight(requestedHeight: number, constraints: UISize): number {
    if (requestedHeight === fillUiSize) {
        return constraints.height;
    }
    if (requestedHeight === wrapUiSize) {
        return constraints.height;
    }
    return requestedHeight;
}

function calculateFinalSize(
    requestedWidth: number,
    requestedHeight: number,
    measuredSize: UISize,
    constraints: UISize,
): UISize {
    let finalWidth: number;
    let finalHeight: number;

    if (requestedWidth === fillUiSize) {
        finalWidth = constraints.width;
    } else if (requestedWidth === wrapUiSize) {
        finalWidth = Math.min(measuredSize.width, constraints.width);
    } else {
        finalWidth = requestedWidth;
    }

    if (requestedHeight === fillUiSize) {
        finalHeight = constraints.height;
    } else if (requestedHeight === wrapUiSize) {
        finalHeight = Math.min(measuredSize.height, constraints.height);
    } else {
        finalHeight = requestedHeight;
    }

    return { width: finalWidth, height: finalHeight };
}
