import { wrapUiSize, fillUiSize } from "../uiSize.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.js";

export type UiGridProps = {
    children: ComponentDescriptor[];
    columns: number;
    itemSize: number;
    gap?: number;
    width: number;
    height: number;
};

export const uiGrid = createComponent<UiGridProps>(
    ({ props, measureDescriptor }) => {
        const gap = props.gap ?? 0;
        const children: PlacedChild[] = [];
        let maxHeight = 0;

        props.children.forEach((child, index) => {
            const col = index % props.columns;
            const row = Math.floor(index / props.columns);

            const x = col * (props.itemSize + gap);
            const y = row * (props.itemSize + gap);

            const childSize = measureDescriptor(`child-${index}`, child, {
                width: props.itemSize,
                height: props.itemSize,
            });

            children.push({
                ...child,
                offset: { x, y },
            });

            maxHeight = Math.max(maxHeight, y + childSize.height);
        });

        let finalWidth = props.width;
        let finalHeight = props.height;

        if (props.width === wrapUiSize) {
            finalWidth =
                props.columns * props.itemSize + (props.columns - 1) * gap;
        }

        if (props.height === wrapUiSize) {
            finalHeight = maxHeight;
        }

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
