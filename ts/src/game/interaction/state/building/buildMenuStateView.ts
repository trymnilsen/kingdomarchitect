import { allSides } from "../../../../common/sides";
import {
    fillUiSize,
    NinePatchBackground,
    UIView,
    wrapUiSize,
} from "../../../../ui/uiView";
import { alignments, UIBox } from "../../../../ui/view/uiBox";

export function buildMenuStateView(): UIView {
    const rootView = new UIBox({
        width: fillUiSize,
        height: fillUiSize,
    });

    rootView.alignment = alignments.center;

    const container = new UIBox({
        width: wrapUiSize,
        height: wrapUiSize,
    });

    container.background = new NinePatchBackground(
        "stoneSlateBackground",
        allSides(16),
        4
    );

    const contentBox = new UIBox({
        width: 300,
        height: 400,
    });

    container.addView(contentBox);

    rootView.addView(container);
    return rootView;
}
