import type { Point } from "../../common/point.js";
import {
    calculateAlignment,
    uiAlignment,
    type UiAlignment,
} from "../uiAlignment.js";
import { wrapUiSize } from "../uiSize.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.js";

type UiStackProps = {
    children: ComponentDescriptor[];
    width: number;
    height: number;
    key?: string | number;
    alignment?: Point;
};

export const uiStack = createComponent<UiStackProps>(
    ({ props, measureDescriptor, constraints }) => {
        let size = constraints;
        if (props.width >= 0) {
            size.width = props.width;
        }
        if (props.height >= 0) {
            size.height = props.height;
        }

        const placedChildren: PlacedChild[] = [];
        let maxChildWidth = 0;
        let maxChildHeight = 0;

        // First pass: measure all children and find the largest dimensions
        for (let i = 0; i < props.children.length; i++) {
            const childDescriptor = props.children[i];
            const childSize = measureDescriptor(
                `child-${i}`,
                childDescriptor,
                constraints,
            );

            maxChildWidth = Math.max(maxChildWidth, childSize.width);
            maxChildHeight = Math.max(maxChildHeight, childSize.height);
        }

        // If wrapping, use the largest child dimensions
        if (props.width === wrapUiSize) {
            size.width = maxChildWidth;
        }

        if (props.height === wrapUiSize) {
            size.height = maxChildHeight;
        }

        // Second pass: position all children with alignment
        for (let i = 0; i < props.children.length; i++) {
            const childDescriptor = props.children[i];
            const childSize = measureDescriptor(
                `child-${i}`,
                childDescriptor,
                constraints,
            );

            const position = calculateAlignment(
                size.width,
                size.height,
                props.alignment ?? uiAlignment.center,
                childSize.width,
                childSize.height,
            );

            placedChildren.push({
                ...childDescriptor,
                size: childSize,
                offset: position,
            });
        }

        return {
            children: placedChildren,
            size,
        };
    },
);
