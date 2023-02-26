import { sprites2 } from "../../../../asset/sprite";
import {
    getBoundsAxis,
    sizeOfBounds,
    withinRectangle,
} from "../../../../common/bounds";
import { InvalidStateError } from "../../../../common/error/invalidStateError";
import {
    distance,
    manhattanDistance,
    Point,
    zeroPoint,
} from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { woodResourceItem } from "../../../../data/inventory/resources";
import { RenderContext } from "../../../../rendering/renderContext";
import {
    subTitleTextStyle,
    titleTextStyle,
} from "../../../../rendering/text/textStyle";
import { colorBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiRow } from "../../../../ui/dsl/uiRowDsl";
import { uiSpace } from "../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { wrapUiSize } from "../../../../ui/uiSize";
import { UISpriteImageSource } from "../../../../ui/view/uiImageSource";
import { InventoryComponent } from "../../../world/component/inventory/inventoryComponent";
import { TilesComponent } from "../../../world/component/tile/tilesComponent";
import { UnlockableArea } from "../../../world/component/tile/unlockableArea";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { AlertMessageState } from "../common/alertMessageState";

export class LandUnlockState extends InteractionState {
    private unlockableArea: UnlockableArea[] = [];
    private selectedArea: UnlockableArea | undefined;
    private previousSelectedAreaPosition: Point | undefined;
    private selectedAreaSize: Point = zeroPoint();

    override onActive(): void {
        this.getUnlockableAreas();

        const actions: ActionButton[] = [
            {
                id: "unlock",
                name: "Unlock",
            },
            {
                id: "cancel",
                name: "Cancel",
            },
        ];

        const actionbarView = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });

        this.view = actionbarView;
    }

    override onTap(screenPosition: Point, worldPosition: Point): boolean {
        for (const unlockedArea of this.unlockableArea) {
            const withinArea = withinRectangle(
                worldPosition,
                unlockedArea.bounds.x1 * TileSize,
                unlockedArea.bounds.y1 * TileSize,
                unlockedArea.bounds.x2 * TileSize,
                unlockedArea.bounds.y2 * TileSize
            );

            if (withinArea) {
                this.selectedArea = unlockedArea;
                this.previousSelectedAreaPosition = {
                    x: unlockedArea.bounds.x1 + 1,
                    y: unlockedArea.bounds.y1 + 1,
                };
                return true;
            }
        }

        return false;
    }

    override onDraw(context: RenderContext): void {
        for (const unlockableArea of this.unlockableArea) {
            const areaScreenSpaceBounds = context.camera.tileSpaceToScreenSpace(
                {
                    x: unlockableArea.bounds.x1,
                    y: unlockableArea.bounds.y1,
                }
            );
            for (const tiles of unlockableArea.tiles) {
                context.drawRectangle({
                    width: 38,
                    height: 38,
                    x: tiles.tileX * TileSize,
                    y: tiles.tileY * TileSize,
                    fill: "purple",
                });
            }
            const bounds = sizeOfBounds(unlockableArea.bounds);
            const boundsWidth = bounds.x * TileSize;
            const boundsHeight = bounds.x * TileSize;
            const view = uiBox({
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
                                            text: unlockableArea.cost.toString(),
                                            style: titleTextStyle,
                                        }),
                                    },
                                ],
                            }),
                        ],
                    }),
                ],
            });
            view.layout(context, { width: boundsWidth, height: boundsHeight });
            view.offset = areaScreenSpaceBounds;
            view.updateTransform();
            view.draw(context);
        }

        if (this.selectedArea) {
            const screenSpace = context.camera.tileSpaceToScreenSpace({
                x: this.selectedArea.bounds.x1,
                y: this.selectedArea.bounds.y1,
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

    private actionSelected(action: ActionButton) {
        if (action.id == "cancel") {
            this.context.stateChanger.clear();
        } else if (action.id == "unlock") {
            // Check if there is enough resources
            const rootEntity = this.context.world.rootEntity;
            const inventoryComponent =
                rootEntity.getComponent(InventoryComponent)!;

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
                    //this.getUnlockableAreas();
                    this.context.stateChanger.clear();
                }
            } else {
                this.context.stateChanger.push(
                    new AlertMessageState("Oh no", "Not enough")
                );
            }
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
                        x: area.bounds.x1 + 1,
                        y: area.bounds.y1 + 1,
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

            this.selectedAreaSize = sizeOfBounds(this.selectedArea.bounds);
        }
    }
}
