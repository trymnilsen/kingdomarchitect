import { wrapUiSize, fillUiSize } from "../uiSize.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.ts";

export type UiGridProps = {
    children: ComponentDescriptor[];
    gap?: number;
    width: number;
    height: number;
};

export const uiGrid = createComponent<UiGridProps>(
    ({ props, measureDescriptor, constraints }) => {
        const gap = props.gap ?? 0;
        const children: PlacedChild[] = [];

        if (props.children.length === 0) {
            const emptyWidth =
                props.width === fillUiSize
                    ? constraints.width
                    : props.width === wrapUiSize
                      ? 0 // No content means zero size for wrap
                      : props.width;

            const emptyHeight =
                props.height === fillUiSize
                    ? constraints.height
                    : props.height === wrapUiSize
                      ? 0 // No content means zero size for wrap
                      : props.height;

            return {
                children,
                size: {
                    width: emptyWidth,
                    height: emptyHeight,
                },
            };
        }

        // Every cell takes the first item's size, so the grid measures one item.
        const firstItemSize = measureDescriptor(
            "grid-item-0",
            props.children[0],
            constraints,
        );

        const availableWidth =
            props.width === fillUiSize
                ? constraints.width
                : props.width === wrapUiSize
                  ? constraints.width // For grid, wrap should still respect parent constraints
                  : props.width;

        const availableHeight =
            props.height === fillUiSize
                ? constraints.height
                : props.height === wrapUiSize
                  ? constraints.height // We'll calculate actual needed height later
                  : props.height;

        const itemWidth = firstItemSize.width;
        const itemHeight = firstItemSize.height;

        // n items span n*itemWidth + (n-1)*gap, so adding one gap to both sides
        // makes the division exact.
        const columnsFloat = (availableWidth + gap) / (itemWidth + gap);
        const columns = Math.max(1, Math.floor(columnsFloat));

        const rows = Math.ceil(props.children.length / columns);

        props.children.forEach((child, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            const x = col * (itemWidth + gap);
            const y = row * (itemHeight + gap);

            children.push({
                ...child,
                offset: { x, y },
                size: firstItemSize,
            });
        });

        const contentWidth = columns * itemWidth + (columns - 1) * gap;
        const finalWidth =
            props.width === wrapUiSize
                ? contentWidth
                : props.width === fillUiSize
                  ? availableWidth
                  : Math.min(props.width, contentWidth);

        const contentHeight = rows * itemHeight + (rows - 1) * gap;
        const finalHeight =
            props.height === wrapUiSize
                ? contentHeight
                : props.height === fillUiSize
                  ? availableHeight
                  : Math.min(props.height, contentHeight);

        return {
            children,
            size: {
                width: finalWidth,
                height: finalHeight,
            },
        };
    },
    { displayName: "UiGrid" },
);
