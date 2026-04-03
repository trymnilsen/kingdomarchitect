import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import {
    CrossAxisAlignment,
    uiColumn,
    uiRow,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiSpace } from "../../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import type { InventoryItem } from "../../../../data/inventory/inventoryItem.ts";
import {
    getItemSources,
    type ItemSource,
    type ItemSourceRecipe,
    type ItemSourceResource,
    type ItemSourceProduction,
} from "../../../../data/inventory/itemSources.ts";

const textStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

const titleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 20,
};

const sectionStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

function recipeSourceRow(source: ItemSourceRecipe): ComponentDescriptor {
    const inputsText = source.recipe.inputs
        .map((i) => `${i.amount}x ${i.item.name}`)
        .join(", ");
    const outputsText = source.recipe.outputs
        .map((o) => `${o.amount}x ${o.item.name}`)
        .join(", ");

    return uiColumn({
        width: fillUiSize,
        height: wrapUiSize,
        children: [
            uiRow({
                width: fillUiSize,
                height: wrapUiSize,
                children: [
                    uiImage({
                        sprite: source.recipe.icon,
                        width: 16,
                        height: 16,
                    }),
                    uiSpace({ width: 4, height: 1 }),
                    uiText({
                        content: `${source.recipe.name}`,
                        textStyle: textStyle,
                    }),
                ],
            }),
            uiText({
                content: `  ${inputsText}`,
                textStyle: textStyle,
            }),
            uiText({
                content: `  at ${source.buildingName}`,
                textStyle: textStyle,
            }),
        ],
    });
}

function resourceSourceRow(source: ItemSourceResource): ComponentDescriptor {
    return uiRow({
        width: fillUiSize,
        height: wrapUiSize,
        children: [
            uiImage({
                sprite: source.resourceAsset,
                width: 16,
                height: 16,
            }),
            uiSpace({ width: 4, height: 1 }),
            uiText({
                content: `${source.resourceName} — ${source.amount}x`,
                textStyle: textStyle,
            }),
        ],
    });
}

function productionSourceRow(
    source: ItemSourceProduction,
): ComponentDescriptor {
    return uiText({
        content: `${source.buildingName} — ${source.amount}x`,
        textStyle: textStyle,
    });
}

function sourceSection(
    title: string,
    rows: ComponentDescriptor[],
): ComponentDescriptor[] {
    return [
        uiSpace({ width: 1, height: 4 }),
        uiText({ content: title, textStyle: sectionStyle }),
        ...rows,
    ];
}

type ItemSourceViewProps = {
    item: InventoryItem;
    sources: ItemSource[];
    onClose: () => void;
};

const itemSourceView = createComponent<ItemSourceViewProps>(
    ({ props }) => {
        const children: ComponentDescriptor[] = [];

        // Header: icon + item name
        children.push(
            uiRow({
                width: fillUiSize,
                height: wrapUiSize,
                children: [
                    uiImage({
                        sprite: props.item.asset,
                        width: 24,
                        height: 24,
                    }),
                    uiSpace({ width: 8, height: 1 }),
                    uiText({
                        content: props.item.name,
                        textStyle: titleStyle,
                    }),
                ],
            }),
        );

        // Group sources by kind
        const recipes = props.sources.filter(
            (s): s is ItemSourceRecipe => s.kind === "recipe",
        );
        const resources = props.sources.filter(
            (s): s is ItemSourceResource => s.kind === "resource",
        );
        const productions = props.sources.filter(
            (s): s is ItemSourceProduction => s.kind === "production",
        );

        if (recipes.length > 0) {
            children.push(
                ...sourceSection("Recipes:", recipes.map(recipeSourceRow)),
            );
        }

        if (resources.length > 0) {
            children.push(
                ...sourceSection(
                    "Resources:",
                    resources.map(resourceSourceRow),
                ),
            );
        }

        if (productions.length > 0) {
            children.push(
                ...sourceSection(
                    "Production:",
                    productions.map(productionSourceRow),
                ),
            );
        }

        if (props.sources.length === 0) {
            children.push(
                uiSpace({ width: 1, height: 8 }),
                uiText({
                    content: "No known sources",
                    textStyle: textStyle,
                }),
            );
        }

        // Close button
        children.push(uiSpace({ width: 1, height: 16 }));
        children.push(
            uiButton({
                width: fillUiSize,
                height: wrapUiSize,
                padding: 12,
                background: ninePatchBackground({
                    sprite: spriteRefs.fancy_wood_bg,
                    sides: allSides(8),
                    scale: 2,
                }),
                onTap: props.onClose,
                child: uiText({
                    content: "Close",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 18,
                    },
                }),
            }),
        );

        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            child: uiBox({
                width: 300,
                height: wrapUiSize,
                background: ninePatchBackground({
                    sprite: spriteRefs.fancy_wood_bg,
                    sides: allSides(8),
                    scale: 4,
                }),
                padding: 32,
                child: uiColumn({
                    width: fillUiSize,
                    height: wrapUiSize,
                    crossAxisAlignment: CrossAxisAlignment.Center,
                    children,
                }),
            }),
        });
    },
    { displayName: "ItemSourceView" },
);

export class ItemSourceState extends InteractionState {
    private item: InventoryItem;

    override get stateName(): string {
        return "ItemSource";
    }

    constructor(item: InventoryItem) {
        super();
        this.item = item;
    }

    override getView(): ComponentDescriptor | null {
        const sources = getItemSources(this.item.id);
        return itemSourceView({
            item: this.item,
            sources: sources,
            onClose: () => {
                this.context.stateChanger.pop(undefined);
            },
        });
    }

    override get isModal(): boolean {
        return true;
    }
}
