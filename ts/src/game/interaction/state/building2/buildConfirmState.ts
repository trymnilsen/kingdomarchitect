import { woodenHouseScaffold } from "../../../../asset/sprites/woodHouseSprite";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { RenderContext } from "../../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";

export class BuildConfirmState extends InteractionState {
    private buildingAnimation: BlinkingImageAnimation;
    private blinkScaffold: boolean = true;
    private selectionPosition: Point = { x: 1, y: 1 };
    constructor() {
        super();
        this.buildingAnimation = new BlinkingImageAnimation({
            x: 0,
            y: 0,
            image: "woodHouse",
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
                sprite: woodenHouseScaffold,
            });
        }

        const cursorWidth = TileSize;
        const cursorHeight = TileSize;

        context.drawNinePatchImage({
            asset: "cursor",
            height: cursorHeight,
            width: cursorWidth,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }
}
