import { addPoint } from "../../../common/point.js";
import { calculateAlignment, uiAlignment } from "../uiAlignment.js";
import type { UIBackground } from "../uiBackground.js";
import { wrapUiSize } from "../uiSize.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.js";

type UiBoxProps = {
    child?: ComponentDescriptor;
    padding?: number;
    background?: UIBackground;
    width: number;
    height: number;
};

export const uiBox = createComponent<UiBoxProps>(
    ({ props, withDraw, measureDescriptor, constraints }) => {
        withDraw((scope, region) => {
            if (props.background) {
                props.background.draw(scope, region, region);
            }
        });
        let size = constraints;
        if (props.width >= 0) {
            size.width = props.width;
        }
        if (props.height >= 0) {
            size.height = props.height;
        }
        const constraintsWithPadding = constraints;
        if (props.padding) {
            constraintsWithPadding.width -= props.padding * 2;
            constraintsWithPadding.height -= props.padding * 2;
        }

        let child: PlacedChild | undefined;
        if (props.child) {
            const childSize = measureDescriptor(
                "child",
                props.child,
                constraintsWithPadding,
            );
            if (props.width == wrapUiSize) {
                size.width = childSize.width;
            }

            if (props.height == wrapUiSize) {
                size.height = childSize.height;
            }

            const position = calculateAlignment(
                size.width,
                size.height,
                uiAlignment.center,
                childSize.width,
                childSize.height,
            );

            child = {
                ...props.child,
                size: childSize,
                offset: props.padding
                    ? addPoint({ x: props.padding, y: props.padding }, position)
                    : position,
            };

            if (props.padding && props.width == wrapUiSize) {
                size.width += props.padding * 2;
            }

            if (props.padding && props.height == wrapUiSize) {
                size.height += props.padding * 2;
            }
        }

        return {
            children: child ? [child] : [],
            size,
        };
    },
);
