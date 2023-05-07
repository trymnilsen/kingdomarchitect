import { sprites2 } from "../../../../asset/sprite";
import { sizeOfBounds, withinRectangle } from "../../../../common/bounds";
import { InvalidStateError } from "../../../../common/error/invalidStateError";
import { manhattanDistance, Point, zeroPoint } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { woodResourceItem } from "../../../../data/inventory/resources";
import { RenderContext } from "../../../../rendering/renderContext";
import { titleTextStyle } from "../../../../rendering/text/textStyle";
import { colorBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiRow } from "../../../../ui/dsl/uiRowDsl";
import { uiSpace } from "../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UISpriteImageSource } from "../../../../ui/view/uiImageSource";
import { InventoryComponent } from "../../../world/component/inventory/inventoryComponent";
import { TilesComponent } from "../../../world/component/tile/tilesComponent";
import { UnlockableArea } from "../../../world/component/tile/unlockableArea";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import {
    UIActionbar,
    UIActionbarAlignment,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { AlertMessageState } from "../common/alertMessageState";

export class LandUnlockState extends InteractionState {
    private unlockableArea: UnlockableArea[] = [];
    private selectedArea: UnlockableArea | undefined;
    private previousSelectedAreaPosition: Point | undefined;
    private selectedAreaSize: Point = zeroPoint();

    override onActive(): void {
        this.getUnlockableAreas();

        const leftActionbar = new UIActionbar(
            [
                {
                    text: "Unlock",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.unlockSelection();
                    },
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            new SpriteBackground(sprites2.stone_slate_background_2x),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    override onTap(screenPosition: Point, worldPosition: Point): boolean {
        for (const unlockedArea of this.unlockableArea) {
            const tileSet = unlockedArea.tileset;
            const withinArea = withinRectangle(
                worldPosition,
                tileSet.bounds.x1 * TileSize,
                tileSet.bounds.y1 * TileSize,
                tileSet.bounds.x2 * TileSize,
                tileSet.bounds.y2 * TileSize
            );

            if (withinArea) {
                this.selectedArea = unlockedArea;
                this.previousSelectedAreaPosition = {
                    x: tileSet.bounds.x1 + 1,
                    y: tileSet.bounds.y1 + 1,
                };
                return true;
            }
        }

        return false;
    }

    override onDraw(context: RenderContext): void {
        for (const unlockableArea of this.unlockableArea) {
            const tileSet = unlockableArea.tileset;
            const areaScreenSpaceBounds = context.camera.tileSpaceToScreenSpace(
                {
                    x: tileSet.bounds.x1,
                    y: tileSet.bounds.y1,
                }
            );
            for (const tiles of tileSet.tiles) {
                context.drawRectangle({
                    width: 38,
                    height: 38,
                    x: tiles.x * TileSize,
                    y: tiles.y * TileSize,
                    fill: "purple",
                });
            }
            const bounds = sizeOfBounds(tileSet.bounds);
            const boundsWidth = bounds.x * TileSize;
            const boundsHeight = bounds.x * TileSize;
            const view = this.getUnlockableLabelView(
                boundsWidth,
                boundsHeight,
                unlockableArea
            );
            view.layout(context, {
                width: boundsWidth,
                height: boundsHeight,
            });
            view.offset = areaScreenSpaceBounds;
            view.updateTransform();
            view.draw(context);
        }

        if (this.selectedArea) {
            const screenSpace = context.camera.tileSpaceToScreenSpace({
                x: this.selectedArea.tileset.bounds.x1,
                y: this.selectedArea.tileset.bounds.y1,
            });

            context.drawNinePatchSprite({
                sprite: sprites2.cursor,
                height: this.selectedAreaSize.x * TileSize,
                width: this.selectedAreaSize.y * TileSize,
                scale: 1.0,
                sides: allSides(12.0),
                x: screenSpace.x,
                y: screenSpace.y,
            });
        }

        super.onDraw(context);
    }

    private unlockSelection() {
        // Check if there is enough resources
        const rootEntity = this.context.world.rootEntity;
        const inventoryComponent = rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component on root entity");
        }

        const selectedArea = this.selectedArea;
        if (!selectedArea) {
            console.error("No selected area, cannot unlock");
            return;
        }

        const removeResult = inventoryComponent.removeInventoryItem(
            woodResourceItem.id,
            selectedArea.cost
        );

        if (removeResult) {
            const tilesComponent = rootEntity.getComponent(TilesComponent);
            if (!!tilesComponent) {
                tilesComponent.unlockArea(selectedArea);
                this.selectedArea = undefined;
                this.selectedAreaSize = zeroPoint();
                this.getUnlockableAreas();
                //this.context.stateChanger.clear();
            }
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Not enough")
            );
        }
    }

    private getUnlockableAreas() {
        const tilesComponent =
            this.context.world.rootEntity.getComponent(TilesComponent);

        if (!tilesComponent) {
            throw new InvalidStateError("No tile component found");
        }

        this.unlockableArea = tilesComponent.getUnlockableArea();
        if (this.unlockableArea.length > 0) {
            this.selectedArea = this.unlockableArea[0];
            if (!!this.previousSelectedAreaPosition) {
                let closestAreaDistanceToPreviousSelection =
                    Number.MAX_SAFE_INTEGER;
                for (const area of this.unlockableArea) {
                    const areaPosition = {
                        x: area.tileset.bounds.x1 + 1,
                        y: area.tileset.bounds.y1 + 1,
                    };

                    const distanceTo = manhattanDistance(
                        this.previousSelectedAreaPosition,
                        areaPosition
                    );

                    if (distanceTo < closestAreaDistanceToPreviousSelection) {
                        this.selectedArea = area;
                        closestAreaDistanceToPreviousSelection = distanceTo;
                    }
                }
            }

            this.selectedAreaSize = sizeOfBounds(
                this.selectedArea.tileset.bounds
            );
        }
    }

    private getUnlockableLabelView(
        boundsWidth: number,
        boundsHeight: number,
        area: UnlockableArea
    ): UIView {
        return uiBox({
            width: boundsWidth,
            height: boundsHeight,
            children: [
                uiBox({
                    padding: allSides(8),
                    width: wrapUiSize,
                    height: wrapUiSize,
                    background: colorBackground("#39034a"),
                    children: [
                        uiRow({
                            width: wrapUiSize,
                            height: wrapUiSize,
                            children: [
                                {
                                    child: uiImage({
                                        width: wrapUiSize,
                                        height: wrapUiSize,
                                        image: new UISpriteImageSource(
                                            sprites2.wood_resource
                                        ),
                                    }),
                                },
                                {
                                    child: uiSpace({ height: 4, width: 4 }),
                                },
                                {
                                    child: uiText({
                                        width: wrapUiSize,
                                        height: wrapUiSize,
                                        text: area.cost.toString(),
                                        style: titleTextStyle,
                                    }),
                                },
                            ],
                        }),
                    ],
                }),
            ],
        });
    }
}
