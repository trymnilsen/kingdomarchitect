import { zeroSize } from "../module/ui/uiSize.js";
import { createComponent, type ComponentDescriptor } from "./ui.js";

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

const sequenceComponent = createComponent<SequenceProps>(() => {
    return {
        size: zeroSize(),
        children: [],
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
