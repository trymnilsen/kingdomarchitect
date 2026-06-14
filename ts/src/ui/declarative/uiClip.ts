import { zeroPoint, type Point } from "../../common/point.ts";
import { fillUiSize } from "../uiSize.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type LayoutResult,
} from "./ui.ts";

export type UiClipProps = {
    child: ComponentDescriptor;
    width: number;
    height: number;
    /**
     * Where to place the child within the viewport, defaults to the origin.
     * Negative values scroll the content up/left out of view; the part outside
     * the viewport is clipped. See {@link uiScrollView}.
     */
    contentOffset?: Point;
    key?: string | number;
};

/**
 * A viewport that clips its child to a fixed size. The child is measured at its
 * natural size and placed at {@link UiClipProps.contentOffset}, so content
 * larger than the clip (or pushed past its edges) is cropped to the clip's
 * bounds for both drawing and hit-testing.
 */
export const uiClip = createComponent<UiClipProps>(
    ({ props, constraints, measureDescriptor }): LayoutResult => {
        const width =
            props.width === fillUiSize ? constraints.width : props.width;
        const height =
            props.height === fillUiSize ? constraints.height : props.height;

        const childSize = measureDescriptor("child", props.child, {
            width,
            height,
        });

        return {
            size: { width, height },
            clip: true,
            children: [
                {
                    ...props.child,
                    offset: props.contentOffset ?? zeroPoint(),
                    size: childSize,
                },
            ],
        };
    },
    { displayName: "UiClip" },
);
