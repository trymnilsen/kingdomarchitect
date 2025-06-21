import type { UIBackground } from "../module/ui/uiBackground.js";
import { zeroSize } from "../module/ui/uiSize.js";
import { createComponent, type ComponentDescriptor } from "./ui.js";

type UiBoxProps = {
    child?: ComponentDescriptor;
    padding?: number;
    background: UIBackground;
    width: number;
    height: number;
};

export const uiBox = createComponent<UiBoxProps>(({ props, withDraw }) => {
    withDraw((scope, region) => {
        /*
        scope.drawScreenSpaceRectangle({
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            fill: props.color,
        });*/
    });
    if (props.child) {
        return props.child;
    } else {
        return {
            children: [],
            size: zeroSize(),
        };
    }
});
