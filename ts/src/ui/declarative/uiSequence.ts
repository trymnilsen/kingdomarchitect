import { type Point } from "../../common/point.js";
import { fillUiSize, wrapUiSize, type UISize } from "../uiSize.js";
import {
    createComponent,
    PlacedChild,
    type ComponentDescriptor,
    type LayoutResult,
} from "./ui.js";

type AxisSizeSelector = (size: UISize) => number;
type PositionFactory = (mainAxis: number, crossAxis: number) => Point;

export const CrossAxisAlignment = {
    Start: 0,
    Center: 1,
    End: 2,
} as const;

export type CrossAxisAlignment = typeof CrossAxisAlignment[keyof typeof CrossAxisAlignment];

export const MainAxisAlignment = {
    Start: 0,
    Center: 1,
    End: 2,
    SpaceBetween: 3,
    SpaceEvenly: 4,
} as const;

export type MainAxisAlignment = typeof MainAxisAlignment[keyof typeof MainAxisAlignment];

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

type MeasuredChildren = {
    descriptor: ComponentDescriptor;
    mainAxisSize: number;
    crossAxisSize: number;
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

        // 1. Measurement pass: determine intrinsic content size
        let mainAxisChildrenSize = 0; // Total size of children only
        let crossAxisMaxContentSize = 0;

        const measuredChildren: MeasuredChildren[] = [];
        const fillSizeChildren: MeasuredChildren[] = [];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // Determine if child wants to fillSize
            const childProps = child.props;
            const wantedMainSize = getMainAxisSize({
                width: childProps?.width ?? wrapUiSize,
                height: childProps?.height ?? wrapUiSize,
            });
            const isFillUiMainSize = wantedMainSize === fillUiSize;

            const slotId = child.key ?? i;
            const childSize = measureDescriptor(slotId, child, constraints);
            let mainAxisSize = getMainAxisSize(childSize);
            if (isFillUiMainSize) {
                mainAxisSize = fillUiSize;
            } else {
                mainAxisChildrenSize += mainAxisSize;
            }
            const childCrossAxisSize = getCrossAxisSize(childSize);
            if (childCrossAxisSize > crossAxisMaxContentSize) {
                crossAxisMaxContentSize = childCrossAxisSize;
            }

            const measuredChild = {
                descriptor: child,
                mainAxisSize: mainAxisSize,
                crossAxisSize: childCrossAxisSize,
            };

            measuredChildren.push(measuredChild);
            if (isFillUiMainSize) {
                fillSizeChildren.push(measuredChild);
            }
        }

        if (fillSizeChildren.length > 0) {
            const totalSize = getMainAxisSize(constraints);
            //Divide remaining size
            const perItemSize =
                (totalSize - mainAxisChildrenSize) / fillSizeChildren.length;

            //If one child has fill size, it will use the remaining and we will
            //always use the max size
            //TODO: we need to handle combined fill size on children and wrap
            //on parent
            mainAxisChildrenSize = totalSize;
            for (const child of fillSizeChildren) {
                child.mainAxisSize = perItemSize;
            }
        }

        // 2. Sizing pass: calculate final component size
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

        // 3. Placement pass: align children within calculated size
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

// Public factory functions
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
