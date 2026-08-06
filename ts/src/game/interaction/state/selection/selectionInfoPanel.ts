import { spriteRefs } from "../../../../asset/sprite.ts";
import { allSides } from "../../../../common/sides.ts";
import {
    titleTextStyle,
    subTitleTextStyle,
} from "../../../../rendering/text/textStyle.ts";
import { type ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import {
    uiColumn,
    uiRow,
    CrossAxisAlignment,
    MainAxisAlignment,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { NinePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { bins } from "../../../../../generated/sprites.ts";
import { constructionMaterialsView } from "./constructionMaterialsView.ts";
import type { SelectionInfo } from "./selectionInfo.ts";

/**
 * The panel pinned to the bottom left describing the current selection.
 *
 * Construction materials and the light reading are optional rows. They appear
 * only when the selection carries that information, which keeps the panel small
 * for a plain tile and detailed for a half-built house.
 */
export function selectionInfoPanel(
    selectionInfo: SelectionInfo,
): ComponentDescriptor {
    const rows: ComponentDescriptor[] = [headerRow(selectionInfo)];

    if (selectionInfo.materials && selectionInfo.materials.length > 0) {
        rows.push(
            constructionMaterialsView({ materials: selectionInfo.materials }),
        );
    }

    if (selectionInfo.light) {
        rows.push(
            uiText({
                content: `Light: ${selectionInfo.light}`,
                textStyle: subTitleTextStyle,
            }),
        );
    }

    return uiColumn({
        height: fillUiSize,
        width: fillUiSize,
        crossAxisAlignment: CrossAxisAlignment.Start,
        mainAxisAlignment: MainAxisAlignment.End,
        children: [
            uiBox({
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 8,
                background: new NinePatchBackground(
                    spriteRefs.stone_slate_background,
                    allSides(8),
                    1.0,
                ),
                child: uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    gap: 8,
                    crossAxisAlignment: CrossAxisAlignment.Start,
                    children: rows,
                }),
            }),
        ],
    });
}

function headerRow(selectionInfo: SelectionInfo): ComponentDescriptor {
    return uiRow({
        width: wrapUiSize,
        height: wrapUiSize,
        gap: 8,
        crossAxisAlignment: CrossAxisAlignment.Center,
        children: [
            uiImage({
                sprite: selectionInfo.icon,
                width: 32,
                height: 40,
                fillMode: "contain",
                scale: iconScale(selectionInfo.icon.bin),
            }),
            uiColumn({
                width: wrapUiSize,
                height: wrapUiSize,
                crossAxisAlignment: CrossAxisAlignment.Start,
                children: [
                    uiText({
                        content: selectionInfo.title,
                        textStyle: titleTextStyle,
                    }),
                    uiText({
                        content: selectionInfo.subtitle,
                        textStyle: subTitleTextStyle,
                    }),
                ],
            }),
        ],
    });
}

/**
 * Icons packed into a generated sprite bin are already at their display size.
 * Anything else comes from a source that needs doubling to match.
 */
function iconScale(bin: string): number {
    if (bins.some((it) => it.name == bin)) {
        return 1;
    }
    return 2;
}
