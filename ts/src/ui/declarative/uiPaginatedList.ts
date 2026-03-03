import { bookInkColor } from "../color.ts";
import { fillUiSize, wrapUiSize } from "../uiSize.ts";
import { createComponent, type ComponentDescriptor } from "./ui.ts";
import { uiButton } from "./uiButton.ts";
import { uiColumn, uiRow, MainAxisAlignment } from "./uiSequence.ts";
import { uiText } from "./uiText.ts";

const footerHeight = 24;

const pageTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

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

export type UiPaginatedListProps = {
    /** All items, pre-built by parent (including selection highlighting). */
    items: ComponentDescriptor[];
    /** Gap between items. Defaults to 4. */
    gap?: number;
    /**
     * Callback when an item is tapped.
     * Receives the global index into the full items array (not page-relative).
     */
    onItemTap?: (globalIndex: number) => void;
    /** Currently selected global index. For reference only — parent pre-builds highlighted items. */
    selectedIndex?: number;
    width: number;
    height: number;
};

export const uiPaginatedList = createComponent<UiPaginatedListProps>(
    ({ props, constraints, measureDescriptor, withState }) => {
        const gap = props.gap ?? 4;
        const [currentPage, setCurrentPage] = withState(0);

        // Resolve fill/wrap sizes against layout constraints
        const resolvedWidth =
            props.width === fillUiSize
                ? constraints.width
                : props.width === wrapUiSize
                  ? constraints.width
                  : props.width;
        const resolvedHeight =
            props.height === fillUiSize
                ? constraints.height
                : props.height === wrapUiSize
                  ? constraints.height
                  : props.height;

        let itemsPerPage = 1;
        let totalPages = 1;

        if (props.items.length > 0) {
            // Determine if footer will be needed. We first try without footer.
            // If items don't fit in one page we need the footer, reducing space.
            const firstItemSize = measureDescriptor("first-item", props.items[0], {
                width: resolvedWidth,
                height: resolvedHeight,
            });

            const itemHeight = firstItemSize.height;

            // Try to fit items without footer first
            const itemsWithoutFooter = Math.max(
                1,
                Math.floor(resolvedHeight / (itemHeight + gap)),
            );
            const pagesWithoutFooter = Math.max(
                1,
                Math.ceil(props.items.length / itemsWithoutFooter),
            );

            if (pagesWithoutFooter > 1) {
                // Need footer — recalculate with reduced height
                const availableForItems = resolvedHeight - footerHeight - gap;
                itemsPerPage = Math.max(
                    1,
                    Math.floor(availableForItems / (itemHeight + gap)),
                );
            } else {
                itemsPerPage = itemsWithoutFooter;
            }

            totalPages = Math.max(
                1,
                Math.ceil(props.items.length / itemsPerPage),
            );
        }

        // Clamp currentPage when items shrink (e.g. after cancellation)
        const clampedPage = Math.min(currentPage, totalPages - 1);
        if (clampedPage !== currentPage) {
            setCurrentPage(clampedPage);
        }

        const startIndex = clampedPage * itemsPerPage;
        const visibleItems = props.items.slice(
            startIndex,
            startIndex + itemsPerPage,
        );

        const showFooter = totalPages > 1;

        const footer = showFooter
            ? uiRow({
                  width: fillUiSize,
                  height: footerHeight,
                  gap: 8,
                  mainAxisAlignment: MainAxisAlignment.Center,
                  children: [
                      uiButton({
                          width: wrapUiSize,
                          height: wrapUiSize,
                          padding: 2,
                          onTap:
                              clampedPage > 0
                                  ? () => setCurrentPage((p) => p - 1)
                                  : undefined,
                          child: uiText({
                              content: "<",
                              textStyle:
                                  clampedPage > 0
                                      ? arrowEnabledStyle
                                      : arrowDisabledStyle,
                          }),
                      }),
                      uiText({
                          content: `${clampedPage + 1}/${totalPages}`,
                          textStyle: pageTextStyle,
                      }),
                      uiButton({
                          width: wrapUiSize,
                          height: wrapUiSize,
                          padding: 2,
                          onTap:
                              clampedPage < totalPages - 1
                                  ? () => setCurrentPage((p) => p + 1)
                                  : undefined,
                          child: uiText({
                              content: ">",
                              textStyle:
                                  clampedPage < totalPages - 1
                                      ? arrowEnabledStyle
                                      : arrowDisabledStyle,
                          }),
                      }),
                  ],
              })
            : null;

        const children: ComponentDescriptor[] = [...visibleItems];
        if (footer) {
            children.push(footer);
        }

        return uiColumn({
            width: resolvedWidth,
            height: resolvedHeight,
            gap,
            children,
        });
    },
    { displayName: "UiPaginatedList" },
);
