import { allSides } from "../../../common/sides.ts";
import { spriteRefs, SPRITE_W, SPRITE_H } from "../../../asset/sprite.ts";
import { spriteRegistry } from "../../../asset/spriteRegistry.ts";
import { bookInkColor } from "../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../ui/declarative/uiImage.ts";
import {
    CrossAxisAlignment,
    MainAxisAlignment,
    uiColumn,
    uiRow,
} from "../../../ui/declarative/uiSequence.ts";
import { uiSpace } from "../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import type { Entity } from "../../entity/entity.ts";
import type { StockEntry } from "../../building/stockAggregate.ts";

export type StockDetailsPageProps = {
    entry?: StockEntry;
    /** Centre the camera on a source stockpile and reveal it. */
    onJump?: (entity: Entity) => void;
    /**
     * Whether to list the stockpiles a pile is stored in with jump targets.
     * Pointless when the view is already scoped to a single inventory — every
     * item is in the same box the player is looking at.
     */
    showSources?: boolean;
};

const headingStyle = { color: bookInkColor, font: "Silkscreen", size: 20 };
const bodyStyle = { color: bookInkColor, font: "Silkscreen", size: 16 };
const sourceStyle = { color: bookInkColor, font: "Silkscreen", size: 14 };

/**
 * The "pop-up book" item preview: an oversized sprite in a shorter framed box so
 * the art spills above the top border, matching the build menu's building
 * preview. The trailing space keeps the art off the bottom border.
 */
function itemPreview(entry: StockEntry): ComponentDescriptor {
    const spriteDef = spriteRegistry.resolve(entry.item.asset);
    const spriteW = spriteDef?.[SPRITE_W] ?? 16;
    const spriteH = spriteDef?.[SPRITE_H] ?? 16;
    const scale = Math.ceil(160 / spriteH);

    return uiBox({
        width: fillUiSize,
        height: 140,
        background: ninePatchBackground({
            sprite: spriteRefs.book_grid_item,
            sides: allSides(8),
            scale: 1,
        }),
        child: uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            children: [
                uiImage({
                    sprite: entry.item.asset,
                    width: spriteW * scale,
                    height: spriteH * scale,
                }),
                uiSpace({ width: 1, height: 16 }),
            ],
        }),
    });
}

/**
 * Right-page detail for a logical stock entry: the icon, name and kingdom-wide
 * total, followed by where the items physically live. Each location is a jump
 * target so the player can navigate to the stockpile holding that pile.
 */
export const stockDetailsPage = createComponent<StockDetailsPageProps>(
    ({ props }) => {
        const entry = props.entry;
        if (!entry) {
            return uiBox({
                width: 268,
                height: 368,
                child: uiText({
                    content: "Nothing in stock",
                    textStyle: headingStyle,
                }),
            });
        }

        const children: ComponentDescriptor[] = [
            itemPreview(entry),
            uiText({ content: entry.item.name, textStyle: headingStyle }),
            uiText({ content: `total: ${entry.total}`, textStyle: bodyStyle }),
        ];

        if (props.showSources !== false) {
            children.push(
                uiText({ content: "stored in:", textStyle: bodyStyle }),
            );
            for (const source of entry.sources) {
                children.push(
                    uiRow({
                        width: fillUiSize,
                        height: wrapUiSize,
                        gap: 8,
                        mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.Center,
                        children: [
                            uiText({
                                content: `${source.entity.id} x${source.amount}`,
                                textStyle: sourceStyle,
                            }),
                            uiButton({
                                width: wrapUiSize,
                                height: wrapUiSize,
                                padding: 4,
                                background: ninePatchBackground({
                                    sprite: spriteRefs.book_border,
                                    sides: allSides(8),
                                }),
                                onTap: () => props.onJump?.(source.entity),
                                child: uiText({
                                    content: "go",
                                    textStyle: sourceStyle,
                                }),
                            }),
                        ],
                    }),
                );
            }
        }

        // Trailing fill spacer pins content to the top of the page.
        children.push(uiSpace({ width: 1, height: fillUiSize }));

        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 8,
            child: uiColumn({
                children,
                width: fillUiSize,
                height: fillUiSize,
                gap: 8,
            }),
        });
    },
    { displayName: "StockDetailsPage" },
);
