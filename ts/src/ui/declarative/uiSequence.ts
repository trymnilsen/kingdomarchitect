import { type Point } from "../../common/point.js";
import { fillUiSize, wrapUiSize, type UISize } from "../uiSize.js";
import {
    createComponent,
    PlacedChild,
    type ComponentDescriptor,
    type LayoutResult,
} from "./ui.js";

// --- Type Definitions and Enums (Unchanged) ---
type AxisSizeSelector = (size: UISize) => number;
type PositionFactory = (mainAxis: number, crossAxis: number) => Point;

export enum CrossAxisAlignment {
    Start,
    Center,
    End,
}
export enum MainAxisAlignment {
    Start,
    Center,
    End,
    SpaceBetween,
    SpaceEvenly,
}

// --- Internal Props for the Generic Sequence ---
type SequenceProps = {
    children: ComponentDescriptor[];
    width: number;
    height: number;
    gap: number;
    mainAxisAlignment: MainAxisAlignment;
    crossAxisAlignment: CrossAxisAlignment;
    getMainAxisSize: AxisSizeSelector;
    getCrossAxisSize: AxisSizeSelector;
    createPosition: PositionFactory;
};

const _uiSequence = createComponent<SequenceProps>(
    ({ props, constraints, measureDescriptor }): LayoutResult => {
        const {
            children,
            width,
            height,
            gap,
            mainAxisAlignment,
            crossAxisAlignment,
            getMainAxisSize,
            getCrossAxisSize,
            createPosition,
        } = props;

        const childCount = children.length;

        // =================================================================
        // 1. MEASUREMENT PASS: Determine the intrinsic size of the content
        // =================================================================
        let mainAxisChildrenSize = 0; // Total size of children only
        let crossAxisMaxContentSize = 0;

        const measuredChildren = children.map((child, index) => {
            const slotId = child.key ?? index;
            const childSize = measureDescriptor(slotId, child, constraints);
            mainAxisChildrenSize += getMainAxisSize(childSize);
            const childCrossAxisSize = getCrossAxisSize(childSize);
            if (childCrossAxisSize > crossAxisMaxContentSize) {
                crossAxisMaxContentSize = childCrossAxisSize;
            }
            return {
                descriptor: child,
                mainAxisSize: getMainAxisSize(childSize),
                crossAxisSize: childCrossAxisSize,
            };
        });

        // =================================================================
        // 2. SIZING PASS: Determine the final size of the component itself
        // =================================================================
        const totalGapSize = childCount > 1 ? (childCount - 1) * gap : 0;
        const mainAxisContentSize = mainAxisChildrenSize + totalGapSize;

        let targetMainAxisSize: number;
        switch (getMainAxisSize({ width, height })) {
            case fillUiSize:
                targetMainAxisSize = getMainAxisSize(constraints);
                break;
            case wrapUiSize:
                targetMainAxisSize = mainAxisContentSize;
                break;
            default:
                targetMainAxisSize = getMainAxisSize({ width, height });
                break;
        }

        let targetCrossAxisSize: number;
        switch (getCrossAxisSize({ width, height })) {
            case fillUiSize:
                targetCrossAxisSize = getCrossAxisSize(constraints);
                break;
            case wrapUiSize:
                targetCrossAxisSize = crossAxisMaxContentSize;
                break;
            default:
                targetCrossAxisSize = getCrossAxisSize({ width, height });
                break;
        }

        // =================================================================
        // 3. PLACEMENT PASS: Align children within the final calculated size
        // =================================================================
        const freeSpace = targetMainAxisSize - mainAxisContentSize;
        let alignmentSpacing = 0;
        let currentMainAxisOffset = 0;

        if (freeSpace > 0) {
            switch (mainAxisAlignment) {
                case MainAxisAlignment.End:
                    currentMainAxisOffset = freeSpace;
                    break;
                case MainAxisAlignment.Center:
                    currentMainAxisOffset = freeSpace / 2;
                    break;
                case MainAxisAlignment.SpaceBetween:
                    if (childCount > 1)
                        alignmentSpacing = freeSpace / (childCount - 1);
                    break;
                case MainAxisAlignment.SpaceEvenly:
                    alignmentSpacing = freeSpace / (childCount + 1);
                    currentMainAxisOffset = alignmentSpacing;
                    break;
            }
        }

        const placedChildren = measuredChildren.map<PlacedChild>(
            (measuredChild, index) => {
                let crossAxisOffset: number;
                switch (crossAxisAlignment) {
                    case CrossAxisAlignment.End:
                        crossAxisOffset =
                            targetCrossAxisSize - measuredChild.crossAxisSize;
                        break;
                    case CrossAxisAlignment.Center:
                        crossAxisOffset =
                            (targetCrossAxisSize -
                                measuredChild.crossAxisSize) /
                            2;
                        break;
                    default:
                        crossAxisOffset = 0;
                        break;
                }

                const offset = createPosition(
                    currentMainAxisOffset,
                    crossAxisOffset,
                );

                const childSize = createPosition(
                    measuredChild.mainAxisSize,
                    measuredChild.crossAxisSize,
                );

                currentMainAxisOffset += measuredChild.mainAxisSize;
                // Add gap and alignment spacing *between* items
                if (index < childCount - 1) {
                    currentMainAxisOffset += gap + alignmentSpacing;
                }

                return {
                    ...measuredChild.descriptor,
                    offset,
                    size: { width: childSize.x, height: childSize.y },
                };
            },
        );

        const finalSizePoint = createPosition(
            targetMainAxisSize,
            targetCrossAxisSize,
        );
        const finalSize: UISize = {
            width: finalSizePoint.x,
            height: finalSizePoint.y,
        };

        return { size: finalSize, children: placedChildren };
    },
);

// --- Public Component Props ---
export type UiRowAndColumnProps = {
    children: ComponentDescriptor[];
    width?: number;
    height?: number;
    gap?: number;
    mainAxisAlignment?: MainAxisAlignment;
    crossAxisAlignment?: CrossAxisAlignment;
};

// =================================================================
// Public Factory Functions
// =================================================================
export const uiRow = (props: UiRowAndColumnProps) =>
    _uiSequence({
        ...props,
        width: props.width ?? wrapUiSize,
        height: props.height ?? wrapUiSize,
        gap: props.gap ?? 0,
        mainAxisAlignment: props.mainAxisAlignment ?? MainAxisAlignment.Start,
        crossAxisAlignment:
            props.crossAxisAlignment ?? CrossAxisAlignment.Start,
        getMainAxisSize: (size) => size.width,
        getCrossAxisSize: (size) => size.height,
        createPosition: (main, cross) => ({ x: main, y: cross }),
    });

export const uiColumn = (props: UiRowAndColumnProps) =>
    _uiSequence({
        ...props,
        width: props.width ?? wrapUiSize,
        height: props.height ?? wrapUiSize,
        gap: props.gap ?? 0,
        mainAxisAlignment: props.mainAxisAlignment ?? MainAxisAlignment.Start,
        crossAxisAlignment:
            props.crossAxisAlignment ?? CrossAxisAlignment.Start,
        getMainAxisSize: (size) => size.height,
        getCrossAxisSize: (size) => size.width,
        createPosition: (main, cross) => ({ x: cross, y: main }),
    });
