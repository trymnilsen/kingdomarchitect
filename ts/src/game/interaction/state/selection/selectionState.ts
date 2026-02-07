import { spriteRefs } from "../../../../asset/sprite.ts";
import { allSides } from "../../../../common/sides.ts";
import { RenderScope } from "../../../../rendering/renderScope.ts";
import { TileSize } from "../../../map/tile.ts";
import { SelectedEntityItem } from "../../selection/selectedEntityItem.ts";
import { SelectedTileItem } from "../../selection/selectedTileItem.ts";
import { SelectedWorldItem } from "../../selection/selectedWorldItem.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { ButtonCollection } from "../../view/buttonCollection.ts";
import { UIActionbarItem } from "../../view/uiActionbar.ts";
import { ActorSelectionProvider } from "./actor/provider/actorSelectionProvider.ts";
import { AttackSelectionProvider } from "./actor/provider/attackSelectionProvider.ts";
import { CraftingBuildingSelectionProvider } from "./actor/provider/craftingBuildingSelectionProvider.ts";
import { CollectableProvider } from "./actor/provider/collectableProvider.ts";
import { TileSelectionProvider } from "./actor/provider/tileSelectionProvider.ts";
import { ResourceSelectionProvider } from "./actor/provider/resourceSelectionProvider.ts";
import { WorkerSelectionProvider } from "./actor/provider/workerSelectionProvider.ts";
import type { SelectionInfo } from "./selectionInfo.ts";
import { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import {
    uiColumn,
    uiRow,
    CrossAxisAlignment,
    MainAxisAlignment,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { NinePatchBackground } from "../../../../ui/uiBackground.ts";
import {
    titleTextStyle,
    subTitleTextStyle,
} from "../../../../rendering/text/textStyle.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { BuildingSelectionProvider } from "./actor/provider/buildingSelectionProvider.ts";
import { ProductionBuildingSelectionProvider } from "./actor/provider/productionBuildingSelectionProvider.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    HealthComponentId,
    type HealthComponent,
} from "../../../component/healthComponent.ts";
import { SpriteComponentId } from "../../../component/spriteComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { getResourceById } from "../../../../data/inventory/items/naturalResource.ts";
import { RoleComponentId } from "../../../component/worker/roleComponent.ts";
import { getRoleDefinition } from "../../../../data/role/roleDefinitions.ts";
import { bins } from "../../../../../generated/sprites.ts";

export class SelectionState extends InteractionState {
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new ResourceSelectionProvider(),
        new TileSelectionProvider(),
        new CollectableProvider(),
        new CraftingBuildingSelectionProvider(),
        new ProductionBuildingSelectionProvider(),
        new AttackSelectionProvider(),
        new BuildingSelectionProvider(),
    ];
    private selection: SelectedWorldItem;

    override get stateName(): string {
        return "Selection";
    }

    constructor(selection: SelectedWorldItem) {
        super();
        this.selection = selection;
    }

    override getView(): ComponentDescriptor | null {
        const items = this.getActionItems();
        const selectionInfo = this.getSelectionInfo();

        // Convert UIActionbarItems to ScaffoldButtons
        const leftButtons = items.left.map((item) => ({
            text: item.text,
            onClick: item.onClick,
            icon: item.icon,
            children: item.children?.map((child) => ({
                text: child.text,
                icon: child.icon,
                onClick: child.onClick,
            })),
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
        const selection = this.selection;
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            selection.tilePosition,
        );

        context.drawNinePatchSprite({
            sprite: spriteRefs.cursor,
            height: selection.selectionSize.x * TileSize,
            width: selection.selectionSize.y * TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });

        if (selection instanceof SelectedEntityItem) {
            const healthComponent =
                selection.entity.getEcsComponent(HealthComponentId);
            if (healthComponent) {
                drawHealthbar(context, selection.entity, healthComponent);
            }
        }
    }

    private getSelectionInfo(): SelectionInfo | null {
        if (this.selection instanceof SelectedTileItem) {
            const type = this.selection.groundTile.type;
            if (!!type) {
                return {
                    title: type,
                    subtitle: "Tile",
                    icon: spriteRefs.blue_book,
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
            let icon = spriteRefs.empty_sprite;
            const spriteComponent =
                this.selection.entity.getEcsComponent(SpriteComponentId);
            if (spriteComponent) {
                icon = spriteComponent.sprite;
            }

            let name = "Entity";
            const buildingComponent =
                this.selection.entity.getEcsComponent(BuildingComponentId);
            if (buildingComponent) {
                name = buildingComponent.building.name;
            }

            const resourceComponent =
                this.selection.entity.getEcsComponent(ResourceComponentId);

            if (resourceComponent) {
                const resource = getResourceById(resourceComponent.resourceId);
                if (resource) {
                    name = resource.name;
                }
            }

            const roleComponent =
                this.selection.entity.getEcsComponent(RoleComponentId);

            if (roleComponent) {
                const roleDefinition = getRoleDefinition(roleComponent.role);
                name = roleDefinition.name;
            }

            return {
                icon: icon,
                subtitle: "selected",
                title: name,
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
                        spriteRefs.stone_slate_background,
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
                                height: 40,
                                fillMode: "contain",
                                scale: bins.some(
                                    (it) => it.name == selectionInfo.icon.bin,
                                )
                                    ? 1
                                    : 2,
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

function drawHealthbar(
    renderContext: RenderScope,
    entity: Entity,
    healthComponent: HealthComponent,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const healthbarWidth = 28;
    const healthbarYOffset = -8;
    const maxHp = healthComponent.maxHp > 0 ? healthComponent.maxHp : 1;
    const percentageWidth = Math.floor(
        (healthbarWidth - 4) * (healthComponent.currentHp / maxHp),
    );

    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 3,
        y: screenPosition.y + healthbarYOffset,
        width: healthbarWidth,
        height: 8,
        fill: "black",
    });
    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 5,
        y: screenPosition.y + 2 + healthbarYOffset,
        width: percentageWidth,
        height: 4,
        fill: "green",
    });
}
