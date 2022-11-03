import { sprites } from "../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../common/sides";
import {
    subTitleTextStyle,
    titleTextStyle,
} from "../../../../rendering/text/textStyle";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { NinePatchBackground } from "../../../../ui/uiBackground";
import { fillUiSize, UIView, wrapUiSize } from "../../../../ui/uiView";
import { UIBox } from "../../../../ui/view/uiBox";
import { UIButton } from "../../../../ui/view/uiButton";
import { UIColumn } from "../../../../ui/view/uiColumn";
import { UIImage } from "../../../../ui/view/uiImage";
import { UISpriteImageSource } from "../../../../ui/view/uiImageSource";
import { UIRow } from "../../../../ui/view/uiRow";
import { UIText } from "../../../../ui/view/uiText";
import { SelectedBuildingUiActionType } from "./selectedBuildingUiAction";

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
    container.alignment = uiAlignment.topCenter;

    container.padding = symmetricSides(32, 16);

    const menuColumn = new UIColumn({
        width: fillUiSize,
        height: fillUiSize,
    });

    const titleText = new UIText({
        width: fillUiSize,
        height: wrapUiSize,
    });

    titleText.textStyle = titleTextStyle;
    titleText.text = "Buildings";

    menuColumn.addView(titleText);
    menuColumn.addView(
        new UIBox({
            width: fillUiSize,
            height: 32,
        })
    );

    menuColumn.addView(buildItemView(1));
    menuColumn.addView(new UIBox({ width: fillUiSize, height: 8 }));
    menuColumn.addView(buildItemView(2));

    container.addView(menuColumn);
    rootView.addView(container);
    return rootView;
}

function buildItemView(number: number): UIView {
    const container = new UIButton({
        width: fillUiSize,
        height: wrapUiSize,
    });
    container.onTapCallback = () => {
        console.log(`Tapped on button: ${number}`);
        container.bubbleAction({
            type: SelectedBuildingUiActionType,
            data: {},
        });
    };

    container.defaultBackground = new NinePatchBackground(
        "stoneSlateBorder",
        allSides(6),
        4
    );
    container.onTappedBackground = new NinePatchBackground(
        "stoneSlateBorderSelected",
        allSides(6),
        4
    );
    container.padding = allSides(16);
    container.addView(
        new UIBox({
            width: fillUiSize,
            height: 50,
        })
    );

    const row = new UIRow({
        width: fillUiSize,
        height: fillUiSize,
    });

    const image = new UIImage({
        width: 24,
        height: 24,
    });

    image.image = new UISpriteImageSource(sprites.woodHouse);
    const text = new UIText({
        width: fillUiSize,
        height: wrapUiSize,
    });
    text.textStyle = subTitleTextStyle;
    text.text = "Wooden House";
    text.id = "labelhouse";
    row.addView(image);
    row.addView(text, 1);
    container.addView(row);

    return container;
}
