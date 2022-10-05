import { allSides } from "../../../../common/sides";
import { uiAlignment } from "../../../../ui/uiAlignment";
import {
    ColorBackground,
    NinePatchBackground,
} from "../../../../ui/uiBackground";
import { fillUiSize, UIView, wrapUiSize } from "../../../../ui/uiView";
import { UIBox } from "../../../../ui/view/uiBox";
import { UIColumn } from "../../../../ui/view/uiColumn";

export function buildMenuStateView(): UIView {
    const rootView = new UIBox({
        width: fillUiSize,
        height: fillUiSize,
    });

    rootView.alignment = uiAlignment.center;

    const container = new UIBox({
        width: 300,
        height: 400,
    });

    container.background = new NinePatchBackground(
        "stoneSlateBackground",
        allSides(16),
        4
    );

    const menuColumn = new UIColumn({
        width: 300,
        height: 400,
    });

    const redBox = new UIBox({
        width: 300,
        height: 50,
    });

    redBox.background = new ColorBackground("red");

    const blueBox = new UIBox({
        width: 300,
        height: fillUiSize,
    });

    blueBox.background = new ColorBackground("blue");
    blueBox.id = "abfd";

    const greenBox = new UIBox({
        width: 300,
        height: fillUiSize,
    });

    greenBox.background = new ColorBackground("green");
    greenBox.id = "kjsa";

    const yellowBox = new UIBox({
        width: 300,
        height: 50,
    });

    yellowBox.background = new ColorBackground("yellow");

    menuColumn.addView(redBox);
    menuColumn.addView(blueBox, 1);
    menuColumn.addView(greenBox, 1);
    menuColumn.addView(yellowBox);

    container.addView(menuColumn);
    rootView.addView(container);
    return rootView;
}
