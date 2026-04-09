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
import { StockpileSelectionProvider } from "./actor/provider/stockpileSelectionProvider.ts";
import { FarmBuildingSelectionProvider } from "./actor/provider/farmBuildingSelectionProvider.ts";
import { FarmComponentId, FarmState } from "../../../component/farmComponent.ts";
import { getCraftingJobDisplayInfos } from "../../../job/craftingJobQuery.ts";
import { craftingQueueStrip } from "../crafting/craftingQueueStrip.ts";
import { uiAbsoluteLayer } from "../../../../ui/declarative/uiAbsoluteLayer.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    HealthComponentId,
    type HealthComponent,
} from "../../../component/healthComponent.ts";
import {
    EnergyComponentId,
    type EnergyComponent,
} from "../../../component/energyComponent.ts";
import { SpriteComponentId } from "../../../component/spriteComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { ProductionComponentId } from "../../../component/productionComponent.ts";
import { getProductionDefinition } from "../../../../data/production/productionDefinition.ts";
import { getDiamondPoints } from "../../../map/item/placement.ts";
import { getResourceById } from "../../../../data/inventory/items/naturalResource.ts";
import { RoleComponentId } from "../../../component/worker/roleComponent.ts";
import { getRoleDefinition } from "../../../../data/role/roleDefinitions.ts";
import { bins } from "../../../../../generated/sprites.ts";
import { BehaviorAgentComponentId } from "../../../component/BehaviorAgentComponent.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";

export class SelectionState extends InteractionState {
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new ResourceSelectionProvider(),
        new TileSelectionProvider(),
        new CollectableProvider(),
        new CraftingBuildingSelectionProvider(),
        new ProductionBuildingSelectionProvider(),
        new StockpileSelectionProvider(),
        new AttackSelectionProvider(),
        new FarmBuildingSelectionProvider(),
        new BuildingSelectionProvider(),
    ];
    private _selection: SelectedWorldItem;

    get selection(): SelectedWorldItem {
        return this._selection;
    }

    override get stateName(): string {
        return "Selection";
    }

    constructor(selection: SelectedWorldItem) {
        super();
        this._selection = selection;
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

        const content = selectionInfo
            ? this.createSelectionInfoPanel(selectionInfo)
            : undefined;

        const scaffold = uiScaffold({
            leftButtons,
            rightButtons,
            content,
        });

        if (this._selection instanceof SelectedEntityItem) {
            const displayInfos = getCraftingJobDisplayInfos(
                this._selection.entity,
            );
            if (displayInfos.length > 0) {
                const tileScreenPos =
                    this.context.camera.tileSpaceToScreenSpace(
                        this._selection.tilePosition,
                    );
                const tileCenterX =
                    tileScreenPos.x +
                    (this._selection.selectionSize.x * TileSize) / 2;
                return uiAbsoluteLayer({
                    base: scaffold,
                    overlays: [
                        {
                            anchorX: tileCenterX,
                            anchorY: tileScreenPos.y - 6,
                            child: craftingQueueStrip({
                                displayInfos,
                                maxVisible: 5,
                            }),
                        },
                    ],
                });
            }
        }

        return scaffold;
    }

    override onUpdate(_tick: number): void {
        // No need to manually update UI - declarative UI will re-render when getView() is called
    }

    override onDraw(context: RenderScope): void {
        super.onDraw(context);
        const selection = this._selection;
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
            const productionComp = selection.entity.getEcsComponent(
                ProductionComponentId,
            );
            if (productionComp) {
                const definition = getProductionDefinition(
                    productionComp.productionId,
                );
                if (definition?.kind === "zone") {
                    const zonePoints = getDiamondPoints(
                        selection.entity.worldPosition,
                        definition.zoneRadius,
                    );
                    for (const zonePoint of zonePoints) {
                        context.drawRectangle({
                            x: zonePoint.x * TileSize + 14,
                            y: zonePoint.y * TileSize + 14,
                            width: 8,
                            height: 8,
                            fill: "lightgreen",
                        });
                    }
                }
            }

            const healthComponent =
                selection.entity.getEcsComponent(HealthComponentId);
            const energyComponent =
                selection.entity.getEcsComponent(EnergyComponentId);
            if (healthComponent) {
                const healthbarYOffset = energyComponent ? -18 : -8;
                drawHealthbar(
                    context,
                    selection.entity,
                    healthComponent,
                    healthbarYOffset,
                );
            }
            if (energyComponent) {
                drawEnergyBar(context, selection.entity, energyComponent);
            }
        }
    }

    private getSelectionInfo(): SelectionInfo | null {
        if (this._selection instanceof SelectedTileItem) {
            const type = this._selection.groundTile.type;
            if (!!type) {
                return {
                    title: type,
                    subtitle: "Tile",
                    icon: spriteRefs.blue_book,
                };
            } else {
                return null;
            }
        } else if (this._selection instanceof SelectedEntityItem) {
            /*
            const selectionComponent = this._selection.entity.getComponent(
                SelectionInfoComponent,
            );

            if (!selectionComponent) {
                return null;
            }

            return selectionComponent.getSelectionInfo();*/
            let icon = spriteRefs.empty_sprite;
            const spriteComponent =
                this._selection.entity.getEcsComponent(SpriteComponentId);
            if (spriteComponent) {
                icon = spriteComponent.sprite;
            }

            let name = "Entity";
            const buildingComponent =
                this._selection.entity.getEcsComponent(BuildingComponentId);
            if (buildingComponent) {
                name = `${this._selection.entity.id} - ${buildingComponent.building.name}`;
            }

            const resourceComponent =
                this._selection.entity.getEcsComponent(ResourceComponentId);

            if (resourceComponent) {
                const resource = getResourceById(resourceComponent.resourceId);
                if (resource) {
                    name = `${this._selection.entity.id} - ${resource.name}`;
                }
            }

            const roleComponent =
                this._selection.entity.getEcsComponent(RoleComponentId);

            if (roleComponent) {
                const roleDefinition = getRoleDefinition(roleComponent.role);
                name = roleDefinition.name;
            }

            if (this._selection.entity.hasComponent(GoblinUnitComponentId)) {
                name = `${this._selection.entity.id}`;
            }

            const farmComponent =
                this._selection.entity.getEcsComponent(FarmComponentId);
            if (farmComponent) {
                let farmSubtitle: string;
                if (farmComponent.state === FarmState.Empty) {
                    farmSubtitle = "empty";
                } else if (farmComponent.state === FarmState.Growing) {
                    const progress = farmComponent.growthDuration > 0
                        ? Math.floor(
                              ((this.context.gameTime.tick - farmComponent.plantedAtTick) /
                                  farmComponent.growthDuration) *
                                  100,
                          )
                        : 100;
                    farmSubtitle = `growing (${Math.min(progress, 99)}%)`;
                } else {
                    farmSubtitle = `${farmComponent.cropItemId} ready`;
                }
                return { icon, subtitle: farmSubtitle, title: name };
            }

            const behaviorAgent = this._selection.entity.getEcsComponent(
                BehaviorAgentComponentId,
            );
            let subtitle = "selected";
            if (behaviorAgent) {
                const behaviorName =
                    behaviorAgent.currentBehaviorName ?? "idle";
                const actionType = behaviorAgent.actionQueue[0]?.type;
                subtitle = actionType
                    ? `${behaviorName} - ${actionType}`
                    : behaviorName;
            }

            return {
                icon: icon,
                subtitle,
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
            const item = provider.provideButtons(this.context, this._selection);
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
    healthbarYOffset: number,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const healthbarWidth = 28;
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

function drawEnergyBar(
    renderContext: RenderScope,
    entity: Entity,
    energyComponent: EnergyComponent,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const barWidth = 28;
    const barYOffset = -8;
    const maxEnergy = energyComponent.maxEnergy > 0 ? energyComponent.maxEnergy : 1;
    const percentageWidth = Math.floor(
        (barWidth - 4) * (energyComponent.energy / maxEnergy),
    );

    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 3,
        y: screenPosition.y + barYOffset,
        width: barWidth,
        height: 8,
        fill: "black",
    });
    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 5,
        y: screenPosition.y + 2 + barYOffset,
        width: percentageWidth,
        height: 4,
        fill: "#4488ff",
    });
}
