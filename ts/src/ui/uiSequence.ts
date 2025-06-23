import { zeroPoint } from "../common/point.js";
import { zeroSize } from "../module/ui/uiSize.js";
import {
    createComponent,
    PlacedChild,
    type ComponentDescriptor,
} from "./ui.js";

export enum CrossAxisAlignment {
    Start,
    Center,
    End,
}

export enum Orientation {
    Vertical,
    Horizontal,
}

type SequenceProps = {
    children: ComponentDescriptor[];
    crossAxisAlignment?: CrossAxisAlignment;
    orientation: Orientation;
    width: number;
    height: number;
};

const sequenceComponent = createComponent<SequenceProps>(({ props }) => {
    const itemSize = Math.floor(props.height / props.children.length);
    return {
        size: { width: props.width, height: props.height },
        children: props.children.map<PlacedChild>((child, index) => {
            return {
                ...child,
                offset: {
                    x: 0,
                    y: index * itemSize,
                },
            };
        }),
    };
});

export type UiRowAndColumnProps = Omit<
    Parameters<typeof sequenceComponent>[0],
    "orientation"
>;

export const uiRow = (props: UiRowAndColumnProps) =>
    sequenceComponent({
        ...props,
        orientation: Orientation.Horizontal,
    });

export const uiColumn = (props: UiRowAndColumnProps) =>
    sequenceComponent({
        ...props,
        orientation: Orientation.Vertical,
    });
