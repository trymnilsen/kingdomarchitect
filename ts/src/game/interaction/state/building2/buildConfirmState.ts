import { sprites2 } from "../../../../asset/sprite";
import { generateId } from "../../../../common/idGenerator";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { woodResourceItem } from "../../../../data/inventory/resources";
import { RenderContext } from "../../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation";
import { BuildJob } from "../../../world/actor/jobs/buildJob";
import { InventoryComponent } from "../../../world/component/inventory/inventoryComponent";
import { housePrefab } from "../../../world/prefab/housePrefab";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { AlertMessageState } from "../common/alertMessageState";

export class BuildConfirmState extends InteractionState {
    private buildingAnimation: BlinkingImageAnimation;
    private blinkScaffold: boolean = true;
    private selectionPosition: Point = { x: 1, y: 1 };
    constructor() {
        super();
        this.buildingAnimation = new BlinkingImageAnimation({
            x: 0,
            y: 0,
            sprite: sprites2.wooden_house,
        });

        const actions: ActionButton[] = [
            {
                id: "build",
                name: "Build",
            },
            {
                id: "mode",
                name: "Mode",
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

    private actionSelected(action: ActionButton) {
        if (action.id == "build") {
            const rootEntity = this.context.world.rootEntity;
            const entitiesAt = rootEntity.getEntityAt(this.selectionPosition);
            if (entitiesAt.length > 0) {
                this.context.stateChanger.push(
                    new AlertMessageState("Oh no", "Spot taken")
                );
                return;
            }
            const inventoryComponent =
                rootEntity.getComponent(InventoryComponent)!;

            const removeResult = inventoryComponent.removeInventoryItem(
                woodResourceItem.id,
                10
            );

            if (removeResult) {
                const house = housePrefab(generateId("house"), true);
                house.position = this.selectionPosition;
                this.context.world.rootEntity.addChild(house);
                this.context.world.jobQueue.schedule(new BuildJob(house));
                this.context.stateChanger.clear();
            } else {
                this.context.stateChanger.push(
                    new AlertMessageState("Oh no", "Not enough")
                );
            }
        } else if (action.id == "mode") {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Not implemented")
            );
        } else {
            this.context.stateChanger.clear();
        }
    }

    override onTileTap(tile: GroundTile): boolean {
        this.selectionPosition = {
            x: tile.tileX,
            y: tile.tileY,
        };

        return true;
    }

    override onUpdate(tick: number): void {
        this.blinkScaffold = !this.blinkScaffold;
    }

    override onDraw(context: RenderContext): void {
        super.onDraw(context);
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.selectionPosition
        );

        if (this.blinkScaffold) {
            context.drawScreenSpaceSprite({
                x: cursorWorldPosition.x + 4,
                y: cursorWorldPosition.y + 4,
                sprite: sprites2.wooden_house_scaffold,
            });
        }

        const cursorWidth = TileSize;
        const cursorHeight = TileSize;

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: cursorHeight,
            width: cursorWidth,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }
}
