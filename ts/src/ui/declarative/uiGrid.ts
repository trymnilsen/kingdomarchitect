import { wrapUiSize, fillUiSize } from "../uiSize.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.js";

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

        // If no children, return empty grid
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

        // Measure the first item to determine item size
        // We assume all items are the same size
        const firstItemSize = measureDescriptor(
            "grid-item-0",
            props.children[0],
            constraints,
        );

        // Calculate how many columns can fit in the available width
        // Handle magic size values: fillUiSize uses constraints, wrapUiSize uses content
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

        // Calculate columns: fit as many items as possible with gaps between them
        // Formula: availableWidth = (columns * itemWidth) + ((columns - 1) * gap)
        // Solving for columns: columns = (availableWidth + gap) / (itemWidth + gap)
        const columnsFloat = (availableWidth + gap) / (itemWidth + gap);
        const columns = Math.max(1, Math.floor(columnsFloat));

        // Calculate number of rows needed
        const rows = Math.ceil(props.children.length / columns);

        // Layout children in grid
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

        // Calculate final grid size
        // For width: if wrapUiSize, use content size; if fillUiSize, use available; otherwise use specified
        const contentWidth = columns * itemWidth + (columns - 1) * gap;
        const finalWidth =
            props.width === wrapUiSize
                ? contentWidth
                : props.width === fillUiSize
                  ? availableWidth
                  : Math.min(props.width, contentWidth);

        // For height: if wrapUiSize, use content size; if fillUiSize, use available; otherwise use specified
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
