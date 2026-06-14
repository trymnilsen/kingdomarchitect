import { allSides } from "../../common/sides.ts";
import { zeroPoint } from "../../common/point.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import { bookInkColor } from "../color.ts";
import { ninePatchBackground } from "../uiBackground.ts";
import { fillUiSize } from "../uiSize.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type LayoutResult,
} from "./ui.ts";
import { uiButton } from "./uiButton.ts";
import { uiClip } from "./uiClip.ts";
import { uiColumn } from "./uiSequence.ts";
import { uiText } from "./uiText.ts";

const scrollbarWidth = 22;
const arrowButtonHeight = 22;
const minThumbHeight = 12;
const thumbColor = "#00000033";

/** A large height used to measure the child's natural (overflowing) size. */
const unboundedHeight = 100000;

const defaultStep = 32;

const arrowEnabledStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

const arrowDisabledStyle = {
    color: "#B0A090",
    font: "Silkscreen",
    size: 12,
};

const arrowOutline = ninePatchBackground({
    sprite: spriteRefs.book_border,
    sides: allSides(8),
});

export type UiScrollViewProps = {
    /** The scrollable content. Must have an intrinsic (wrap) height. */
    child: ComponentDescriptor;
    width: number;
    height: number;
    /** Distance scrolled per arrow press. Defaults to 32. */
    step?: number;
    key?: string | number;
};

/**
 * Clamps a desired scroll offset to the valid range for the given content and
 * viewport. The maximum scroll is the amount of content hidden below the
 * viewport; content that fits cannot scroll.
 */
export function clampScroll(
    offset: number,
    contentHeight: number,
    viewportHeight: number,
): number {
    const maxScroll = Math.max(0, contentHeight - viewportHeight);
    return Math.max(0, Math.min(offset, maxScroll));
}

export type ScrollThumbMetrics = {
    /** Height of the thumb in pixels. */
    height: number;
    /** Top of the thumb relative to the track top. */
    offset: number;
};

/**
 * Computes the size and position of the scroll thumb. The thumb height is the
 * viewport's fraction of the content (clamped to a minimum), and its offset
 * tracks how far the content is scrolled.
 */
export function scrollThumbMetrics(
    trackHeight: number,
    viewportHeight: number,
    contentHeight: number,
    scrollOffset: number,
): ScrollThumbMetrics {
    const ratio = Math.min(1, viewportHeight / contentHeight);
    const height = Math.max(minThumbHeight, Math.floor(trackHeight * ratio));
    const maxScroll = Math.max(0, contentHeight - viewportHeight);
    const scrollRatio = maxScroll > 0 ? scrollOffset / maxScroll : 0;
    const offset = Math.round((trackHeight - height) * scrollRatio);
    return { height, offset };
}

type ScrollThumbTrackProps = {
    viewportHeight: number;
    contentHeight: number;
    scrollOffset: number;
    width: number;
    height: number;
};

const scrollThumbTrack = createComponent<ScrollThumbTrackProps>(
    ({ props, constraints, withDraw }): LayoutResult => {
        withDraw((scope, region) => {
            const thumb = scrollThumbMetrics(
                region.height,
                props.viewportHeight,
                props.contentHeight,
                props.scrollOffset,
            );
            const thumbInset = 7;
            scope.drawScreenSpaceRectangle({
                x: region.x + thumbInset,
                y: region.y + thumb.offset,
                width: Math.max(2, region.width - thumbInset * 2),
                height: thumb.height,
                fill: thumbColor,
            });
        });

        return {
            size: { width: scrollbarWidth, height: constraints.height },
            children: [],
        };
    },
    { displayName: "ScrollThumbTrack" },
);

export const uiScrollView = createComponent<UiScrollViewProps>(
    ({ props, constraints, measureDescriptor, withState }): LayoutResult => {
        const [scrollOffset, setScrollOffset] = withState(0);
        const step = props.step ?? defaultStep;

        const viewportWidth =
            props.width === fillUiSize ? constraints.width : props.width;
        const viewportHeight =
            props.height === fillUiSize ? constraints.height : props.height;

        // Measure at the full width first; only if the content overflows do we
        // reserve a gutter for the scrollbar and re-measure against the
        // narrower width (which can itself change the wrapped height).
        const fullMeasure = measureDescriptor("content", props.child, {
            width: viewportWidth,
            height: unboundedHeight,
        });

        if (fullMeasure.height <= viewportHeight) {
            return {
                size: { width: viewportWidth, height: viewportHeight },
                children: [
                    {
                        ...props.child,
                        offset: zeroPoint(),
                        size: fullMeasure,
                    },
                ],
            };
        }

        const contentWidth = viewportWidth - scrollbarWidth;
        const contentMeasure = measureDescriptor("content", props.child, {
            width: contentWidth,
            height: unboundedHeight,
        });
        const contentHeight = contentMeasure.height;

        const clampedOffset = clampScroll(
            scrollOffset,
            contentHeight,
            viewportHeight,
        );
        if (clampedOffset !== scrollOffset) {
            setScrollOffset(clampedOffset);
        }
        const maxScroll = Math.max(0, contentHeight - viewportHeight);

        const viewport = uiClip({
            width: contentWidth,
            height: viewportHeight,
            contentOffset: { x: 0, y: -clampedOffset },
            child: props.child,
        });

        const canScrollUp = clampedOffset > 0;
        const canScrollDown = clampedOffset < maxScroll;

        const scrollbar = uiColumn({
            width: scrollbarWidth,
            height: viewportHeight,
            children: [
                uiButton({
                    width: scrollbarWidth,
                    height: arrowButtonHeight,
                    background: arrowOutline,
                    onTap: canScrollUp
                        ? () =>
                              setScrollOffset((current) =>
                                  clampScroll(
                                      current - step,
                                      contentHeight,
                                      viewportHeight,
                                  ),
                              )
                        : undefined,
                    child: uiText({
                        content: "▲",
                        textStyle: canScrollUp
                            ? arrowEnabledStyle
                            : arrowDisabledStyle,
                    }),
                }),
                scrollThumbTrack({
                    viewportHeight,
                    contentHeight,
                    scrollOffset: clampedOffset,
                    width: scrollbarWidth,
                    height: fillUiSize,
                }),
                uiButton({
                    width: scrollbarWidth,
                    height: arrowButtonHeight,
                    background: arrowOutline,
                    onTap: canScrollDown
                        ? () =>
                              setScrollOffset((current) =>
                                  clampScroll(
                                      current + step,
                                      contentHeight,
                                      viewportHeight,
                                  ),
                              )
                        : undefined,
                    child: uiText({
                        content: "▼",
                        textStyle: canScrollDown
                            ? arrowEnabledStyle
                            : arrowDisabledStyle,
                    }),
                }),
            ],
        });

        return {
            size: { width: viewportWidth, height: viewportHeight },
            children: [
                {
                    ...viewport,
                    offset: zeroPoint(),
                    size: { width: contentWidth, height: viewportHeight },
                },
                {
                    ...scrollbar,
                    offset: { x: contentWidth, y: 0 },
                    size: { width: scrollbarWidth, height: viewportHeight },
                },
            ],
        };
    },
    { displayName: "UiScrollView" },
);
