import { sprites } from "../../../asset/sprite";
import { Point, pointEquals } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { drawLayout, onTapLayout } from "../../../ui/layout/layout";
import { Camera } from "../../../rendering/camera";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { TileSize } from "../../entity/tile";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";
import { actionbarView, ActionButton } from "../../../ui/view/actionbar";
import { LayoutNode } from "../../../ui/layout/layoutNode";

export class MoveState extends InteractionState {
    private tileSpaceSelection: Point | null;
    private initialSelection: Point;
    private path: Point[] = [];
    private actions: ActionButton[] = [];
    private actionbar: LayoutNode | null = null;
    constructor(tileSpaceSelection: Point) {
        super();
        this.tileSpaceSelection = null;
        this.initialSelection = tileSpaceSelection;
        this.actions = [
            {
                name: "Confirm",
                id: "confirm",
            },
            {
                name: "Cancel",
                id: "cancel",
            },
        ];
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        if (this.actionbar) {
            const hitResult = onTapLayout(this.actionbar, screenPosition);
            if (hitResult.handled) {
                console.log("tapped actionbar");
                return true;
            }
        }
        return false;
    }
    onTileTap(tile: GroundTile, stateChanger: InteractionStateChanger): void {
        console.log("Tapped tile: ", tile);
        const newPath = this.context.world.findPath(this.initialSelection, {
            x: tile.tileX,
            y: tile.tileY,
        });
        console.log("New path: ", newPath);
        if (newPath.length > 0) {
            this.path = newPath;
        }

        this.tileSpaceSelection = {
            x: tile.tileX,
            y: tile.tileY,
        };
    }
    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }
    onDraw(context: RenderContext): void {
        let cursorWorldPosition = this.getCursorPosition(context.camera);

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2,
        });

        for (const pathItem of this.path) {
            const pathWorldPosition = context.camera.tileSpaceToWorldSpace({
                x: pathItem.x,
                y: pathItem.y,
            });

            if (!pointEquals(pathWorldPosition, cursorWorldPosition)) {
                context.drawRectangle({
                    x: pathWorldPosition.x + TileSize / 2 - 5,
                    y: pathWorldPosition.y + TileSize / 2 - 5,
                    width: 8,
                    height: 8,
                    fill: "purple",
                });
            }
        }

        this.actionbar = actionbarView(context, this.actions);
        drawLayout(context, this.actionbar);
    }

    private getCursorPosition(camera: Camera): Point {
        if (!!this.tileSpaceSelection) {
            return camera.tileSpaceToWorldSpace({
                x: this.tileSpaceSelection.x,
                y: this.tileSpaceSelection.y,
            });
        } else {
            return camera.tileSpaceToWorldSpace({
                x: this.initialSelection.x,
                y: this.initialSelection.y,
            });
        }
    }
}
