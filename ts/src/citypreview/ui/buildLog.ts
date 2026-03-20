import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiColumn } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";
import { wrapUiSize } from "../../ui/uiSize.ts";
import { LAYOUT } from "./cityPreviewConstants.ts";

const MAX_LOG_ENTRIES = 20;

export function createBuildLog(
    log: string[],
    width: number,
): ComponentDescriptor {
    const entries = log.slice(-MAX_LOG_ENTRIES);
    const items: ComponentDescriptor[] = entries.map((entry) =>
        uiText({
            content: entry,
            textStyle: subTitleTextStyle,
            width,
        }),
    );

    if (items.length === 0) {
        items.push(
            uiText({
                content: "No activity yet",
                textStyle: subTitleTextStyle,
                width,
            }),
        );
    }

    return uiColumn({
        width,
        height: wrapUiSize,
        gap: 4,
        children: items,
    });
}
