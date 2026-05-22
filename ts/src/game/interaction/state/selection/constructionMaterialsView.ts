import { createComponent } from "../../../../ui/declarative/ui.ts";
import {
    uiColumn,
    uiRow,
    CrossAxisAlignment,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { wrapUiSize } from "../../../../ui/uiSize.ts";
import { subTitleTextStyle } from "../../../../rendering/text/textStyle.ts";
import type { ConstructionMaterialProgress } from "../../../building/materialQuery.ts";

export const constructionMaterialsView = createComponent<{
    materials: ConstructionMaterialProgress[];
}>(({ props }) => {
    return uiColumn({
        width: wrapUiSize,
        height: wrapUiSize,
        gap: 2,
        crossAxisAlignment: CrossAxisAlignment.Start,
        children: [
            uiText({ content: "Materials:", textStyle: subTitleTextStyle }),
            ...props.materials.map((entry) =>
                uiRow({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    gap: 4,
                    crossAxisAlignment: CrossAxisAlignment.Center,
                    children: [
                        uiImage({
                            sprite: entry.item.asset,
                            width: 16,
                            height: 16,
                        }),
                        uiText({
                            content: `${entry.provided}/${entry.required} ${entry.item.name}`,
                            textStyle: subTitleTextStyle,
                        }),
                    ],
                }),
            ),
        ],
    });
});
