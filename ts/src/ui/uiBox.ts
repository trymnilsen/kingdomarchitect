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
        if (props.background) {
            props.background.draw(scope, region, region);
        }
    });
    if (props.child) {
        return props.child;
    } else {
        return {
            children: [],
            size: {
                width: props.width,
                height: props.height,
            },
        };
    }
});
