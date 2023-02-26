import { sprites2 } from "../../../asset/sprite";
import { allSides } from "../../../common/sides";
import { subTitleTextStyle } from "../../../rendering/text/textStyle";
import { ninePatchBackground } from "../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../ui/dsl/uiColumnDsl";
import { RowChild, uiRow } from "../../../ui/dsl/uiRowDsl";
import { uiText } from "../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../ui/uiAlignment";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize";
import { UIView } from "../../../ui/uiView";

export interface ActionButton {
    name: string;
    id: string;
}

export function getActionbarView(
    actions: ActionButton[],
    onClick: (button: ActionButton) => void
): UIView {
    const actionbarButton = (action: ActionButton): RowChild => {
        return {
            child: uiColumn({
                width: wrapUiSize,
                height: wrapUiSize,
                children: [
                    {
                        child: uiButton({
                            width: 48,
                            height: 48,
                            onTapCallback: () => {
                                console.log("Action tapped: ", action);
                                onClick(action);
                            },
                            defaultBackground: ninePatchBackground({
                                sprite: sprites2.stone_slate_background,
                                scale: 2,
                            }),
                        }),
                    },
                    {
                        child: uiText({
                            width: wrapUiSize,
                            height: wrapUiSize,
                            text: action.name,
                            style: subTitleTextStyle,
                        }),
                    },
                ],
            }),
        };
    };

    const buttons: RowChild[] = [];
    for (const action of actions) {
        buttons.push(actionbarButton(action));
        buttons.push({ child: uiBox({ width: 8, height: 1 }) });
    }
    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: allSides(16),
        alignment: uiAlignment.bottomLeft,
        children: [
            uiRow({
                width: wrapUiSize,
                height: wrapUiSize,
                children: buttons,
            }),
        ],
    });
}
