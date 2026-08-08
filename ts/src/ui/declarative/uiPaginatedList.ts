import { allSides } from "../../common/sides.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import { bookInkColor } from "../color.ts";
import { ninePatchBackground } from "../uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../uiSize.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type LayoutResult,
    type PlacedChild,
} from "./ui.ts";
import { uiButton } from "./uiButton.ts";
import { MainAxisAlignment, uiRow } from "./uiSequence.ts";
import { uiText } from "./uiText.ts";

const footerHeight = 30;
const defaultWindowSize = 5;

const pageTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 14,
};

const arrowEnabledStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 14,
};

const arrowDisabledStyle = {
    color: "#B0A090",
    font: "Silkscreen",
    size: 14,
};

/**
 * Picks the window of page indices to show in the pager. Centers on the current
 * page and slides so the window stays full once you move past the first pages,
 * e.g. for 10 pages a window of 5 reads `0 1 2 3 4` near the start and
 * `5 6 7 8 9` near the end. Returns 0-based page indices.
 */
export function pagerWindow(
    current: number,
    total: number,
    size: number,
): number[] {
    const windowSize = Math.min(size, total);
    let start = current - Math.floor(windowSize / 2);
    start = Math.max(0, Math.min(start, total - windowSize));
    const pages: number[] = [];
    for (let i = 0; i < windowSize; i++) {
        pages.push(start + i);
    }
    return pages;
}

export type UiPaginatedListProps = {
    /** Total number of items across all pages. */
    itemCount: number;
    /** How many item rows to lay out per page. */
    itemsPerPage: number;
    /** Builds the row for a given global item index. */
    renderItem: (index: number) => ComponentDescriptor;
    /** Gap between item rows. Defaults to 4. */
    gap?: number;
    /** Number of page buttons shown in the pager window. Defaults to 5. */
    windowSize?: number;
    width: number;
    height: number;
};

/**
 * The height each row gets on a page: the item area divided evenly by the
 * configured items-per-page. The divisor is always `itemsPerPage`, never the
 * number of rows actually on the page, so a row is the same height on a full
 * page and on a partial last page — there is no leftover space to absorb.
 */
export function paginatedItemHeight(
    availableHeight: number,
    itemsPerPage: number,
    gap: number,
): number {
    const totalGap = (itemsPerPage - 1) * gap;
    return Math.max(1, Math.floor((availableHeight - totalGap) / itemsPerPage));
}

/**
 * A non-scrolling list that lays out a fixed number of rows per page and pages
 * the rest behind a numbered `< 1 2 3 4 5 >` footer. The page height is divided
 * evenly across `itemsPerPage`, and each row is given that height as a fixed
 * constraint, so a well-behaved row (one that fills its height) leaves no gap.
 * Only the current page's rows are built (via
 * {@link UiPaginatedListProps.renderItem}), so a long list costs one page of
 * rows rather than all of them.
 */
export const uiPaginatedList = createComponent<UiPaginatedListProps>(
    ({ props, constraints, withState }): LayoutResult => {
        const gap = props.gap ?? 4;
        const windowSize = props.windowSize ?? defaultWindowSize;
        const itemsPerPage = Math.max(1, props.itemsPerPage);
        const [currentPage, setCurrentPage] = withState(0);

        const width =
            props.width === fillUiSize || props.width === wrapUiSize
                ? constraints.width
                : props.width;
        const height =
            props.height === fillUiSize || props.height === wrapUiSize
                ? constraints.height
                : props.height;

        const totalPages = Math.max(
            1,
            Math.ceil(props.itemCount / itemsPerPage),
        );

        // Clamp the page when the item count shrinks (e.g. after a filter).
        const clampedPage = Math.min(currentPage, totalPages - 1);
        if (clampedPage !== currentPage) {
            setCurrentPage(clampedPage);
        }

        const showFooter = totalPages > 1;
        const itemAreaHeight = showFooter
            ? height - footerHeight - gap
            : height;
        const itemHeight = paginatedItemHeight(
            itemAreaHeight,
            itemsPerPage,
            gap,
        );

        const startIndex = clampedPage * itemsPerPage;
        const children: PlacedChild[] = [];
        for (let i = 0; i < itemsPerPage; i++) {
            const index = startIndex + i;
            if (index >= props.itemCount) {
                break;
            }
            children.push({
                ...props.renderItem(index),
                offset: { x: 0, y: i * (itemHeight + gap) },
                size: { width, height: itemHeight },
            });
        }

        if (showFooter) {
            children.push({
                ...buildPager(
                    clampedPage,
                    totalPages,
                    windowSize,
                    setCurrentPage,
                ),
                offset: { x: 0, y: height - footerHeight },
                size: { width, height: footerHeight },
            });
        }

        return { size: { width, height }, children };
    },
    { displayName: "UiPaginatedList" },
);

function buildPager(
    currentPage: number,
    totalPages: number,
    windowSize: number,
    setCurrentPage: (updater: (page: number) => number) => void,
): ComponentDescriptor {
    const canPrev = currentPage > 0;
    const canNext = currentPage < totalPages - 1;

    const pageButtons = pagerWindow(currentPage, totalPages, windowSize).map(
        (page) => {
            const isCurrent = page === currentPage;
            return uiButton({
                key: `page-${page}`,
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 5,
                background: isCurrent
                    ? ninePatchBackground({
                          sprite: spriteRefs.book_grid_item_focused,
                          sides: allSides(8),
                      })
                    : undefined,
                onTap: isCurrent ? undefined : () => setCurrentPage(() => page),
                child: uiText({
                    content: `${page + 1}`,
                    textStyle: pageTextStyle,
                }),
            });
        },
    );

    return uiRow({
        width: fillUiSize,
        height: footerHeight,
        gap: 8,
        mainAxisAlignment: MainAxisAlignment.Center,
        children: [
            uiButton({
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 4,
                onTap: canPrev ? () => setCurrentPage((p) => p - 1) : undefined,
                child: uiText({
                    content: "<",
                    textStyle: canPrev ? arrowEnabledStyle : arrowDisabledStyle,
                }),
            }),
            ...pageButtons,
            uiButton({
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 4,
                onTap: canNext ? () => setCurrentPage((p) => p + 1) : undefined,
                child: uiText({
                    content: ">",
                    textStyle: canNext ? arrowEnabledStyle : arrowDisabledStyle,
                }),
            }),
        ],
    });
}
