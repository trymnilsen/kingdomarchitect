import { sprites2 } from "../../../../asset/sprite";
import { generateId } from "../../../../common/idGenerator";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { Building } from "../../../../data/building/building";
import { woodResourceItem } from "../../../../data/inventory/resources";
import { RenderContext } from "../../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize } from "../../../../ui/uiSize";
import { BuildJob } from "../../../world/actor/jobs/buildJob";
import { InventoryComponent } from "../../../world/component/inventory/inventoryComponent";
import { TilesComponent } from "../../../world/component/tile/tilesComponent";
import { buildingPrefab } from "../../../world/prefab/buildingPrefab";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { AlertMessageState } from "../common/alertMessageState";

export class BuildConfirmState extends InteractionState {
    private buildingAnimation: BlinkingImageAnimation;
    private blinkScaffold: boolean = true;
    private selectionPosition: Point = { x: 1, y: 1 };
    constructor(private building: Building) {
        super();
        this.buildingAnimation = new BlinkingImageAnimation({
            x: 0,
            y: 0,
            sprite: building.icon,
        });
    }

    override onActive(): void {
        const actions: UIActionbarItem[] = [
            {
                text: "Confirm",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.confirmBuildSelection();
                },
            },
            {
                text: "Mode",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.changeBuildMode();
                },
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.cancel();
                },
            },
        ];

        const leftActionbar = new UIActionbar(
            actions,
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

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }

    private confirmBuildSelection() {
        const rootEntity = this.context.world.rootEntity;
        const entitiesAt = rootEntity.getEntityAt(this.selectionPosition);
        const treeAt = rootEntity
            .getComponent(TilesComponent)
            ?.getTile(this.selectionPosition)?.hasTree;

        if (entitiesAt.length > 0 || !!treeAt) {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Spot taken")
            );
            return;
        }
        const inventoryComponent = rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component of root entity");
        }

        const removeResult = inventoryComponent.removeInventoryItem(
            woodResourceItem.id,
            10
        );

        if (removeResult) {
            const house = buildingPrefab(generateId("building"), this.building);
            house.position = this.selectionPosition;
            this.context.world.rootEntity.addChild(house);
            this.context.world.jobQueue.schedule(new BuildJob(house));
            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Not enough")
            );
        }
    }

    private changeBuildMode() {
        this.context.stateChanger.push(
            new AlertMessageState("Oh no", "Not implemented")
        );
    }

    private cancel() {
        this.context.stateChanger.clear();
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
                sprite: this.building.icon,
                targetWidth: 32,
                targetHeight: 32,
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
