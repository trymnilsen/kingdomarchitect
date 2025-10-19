import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { TileSize } from "../../../map/tile.js";
import { SelectedEntityItem } from "../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../selection/selectedWorldItem.js";
import { InteractionState } from "../../handler/interactionState.js";
import { ButtonCollection } from "../../view/buttonCollection.js";
import { UIActionbarItem } from "../../view/uiActionbar.js";
import { ActorSelectionProvider } from "./actor/provider/actorSelectionProvider.js";
import { AttackSelectionProvider } from "./actor/provider/attackSelectionProvider.js";
import { BlacksmithSelectionProvider } from "./actor/provider/blacksmithSelectionProvider.js";
import { CollectableProvider } from "./actor/provider/collectableProvider.js";
import { TileSelectionProvider } from "./actor/provider/tileSelectionProvider.js";
import { TreeSelectionProvider } from "./actor/provider/treeSelectionProvider.js";
import { WorkerSelectionProvider } from "./actor/provider/workerSelectionProvider.js";
import type { SelectionInfo } from "./selectionInfo.js";
import { ComponentDescriptor } from "../../../../ui/declarative/ui.js";
import { uiBox } from "../../../../ui/declarative/uiBox.js";
import {
    uiColumn,
    uiRow,
    CrossAxisAlignment,
    MainAxisAlignment,
} from "../../../../ui/declarative/uiSequence.js";
import { uiText } from "../../../../ui/declarative/uiText.js";
import { uiImage } from "../../../../ui/declarative/uiImage.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { NinePatchBackground } from "../../../../ui/uiBackground.js";
import {
    titleTextStyle,
    subTitleTextStyle,
} from "../../../../rendering/text/textStyle.js";
import { uiScaffold } from "../../view/uiScaffold.js";
import { BuildingSelectionProvider } from "./actor/provider/buildingSelectionProvider.js";

export class SelectionState extends InteractionState {
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new TreeSelectionProvider(),
        new TileSelectionProvider(),
        new CollectableProvider(),
        new BlacksmithSelectionProvider(),
        new AttackSelectionProvider(),
        new BuildingSelectionProvider(),
    ];

    override get stateName(): string {
        return "Selection";
    }

    constructor(private selection: SelectedWorldItem) {
        super();
    }

    override getView(): ComponentDescriptor | null {
        const items = this.getActionItems();
        const selectionInfo = this.getSelectionInfo();

        // Convert UIActionbarItems to ScaffoldButtons
        const leftButtons = items.left.map((item) => ({
            text: item.text,
            onClick: item.onClick,
            icon: item.icon,
        }));

        const rightButtons = items.right.map((item) => ({
            text: item.text,
            onClick: item.onClick,
            icon: item.icon,
            children: item.children?.map((child) => ({
                text: child.text,
                icon: child.icon,
                onClick: child.onClick,
            })),
        }));

        // Create content that shows selection info
        const content = selectionInfo
            ? this.createSelectionInfoPanel(selectionInfo)
            : undefined;

        return uiScaffold({
            leftButtons,
            rightButtons,
            content,
        });
    }

    override onUpdate(_tick: number): void {
        // No need to manually update UI - declarative UI will re-render when getView() is called
    }

    override onDraw(context: RenderScope): void {
        super.onDraw(context);

        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.selection.tilePosition,
        );

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: this.selection.selectionSize.x * TileSize,
            width: this.selection.selectionSize.y * TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }

    private getSelectionInfo(): SelectionInfo | null {
        if (this.selection instanceof SelectedTileItem) {
            const type = this.selection.groundTile.type;
            if (!!type) {
                return {
                    title: type,
                    subtitle: "Tile",
                    icon: sprites2.blue_book,
                };
            } else {
                return null;
            }
        } else if (this.selection instanceof SelectedEntityItem) {
            /*
            const selectionComponent = this.selection.entity.getComponent(
                SelectionInfoComponent,
            );

            if (!selectionComponent) {
                return null;
            }

            return selectionComponent.getSelectionInfo();*/
            return {
                icon: sprites2.archer_skill,
                subtitle: "selected",
                title: "Entity",
            };
        } else {
            return null;
        }
    }

    private createSelectionInfoPanel(
        selectionInfo: SelectionInfo,
    ): ComponentDescriptor {
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
                        sprites2.stone_slate_background,
                        allSides(8),
                        1.0,
                    ),
                    child: uiRow({
                        width: wrapUiSize,
                        height: wrapUiSize,
                        gap: 8,
                        crossAxisAlignment: CrossAxisAlignment.Center,
                        children: [
                            uiImage({
                                sprite: selectionInfo.icon,
                                width: 32,
                                height: 32,
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
                    }),
                }),
            ],
        });
    }

    private getActionItems(): ButtonCollection {
        const leftItems: UIActionbarItem[] = [];
        const rightItems: UIActionbarItem[] = [];

        for (const provider of this.providers) {
            const item = provider.provideButtons(this.context, this.selection);
            leftItems.push(...item.left);
            rightItems.push(...item.right);
        }

        return {
            left: leftItems,
            right: rightItems,
        };
    }
}
