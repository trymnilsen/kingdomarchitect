import { sprites } from "../../../asset/sprite";
import { Point, pointEquals } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { TileSize } from "../../entity/tile";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";

export class MoveState extends InteractionState {
    private tileSpaceSelection: Point;
    private path: Point[] = [];
    constructor(tileSpaceSelection: Point) {
        super();
        this.tileSpaceSelection = tileSpaceSelection;
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        return false;
    }
    onTileTap(tile: GroundTile, stateChanger: InteractionStateChanger): void {
        console.log("Tapped tile: ", tile);
        const newPath = this.context.world.findPath(this.tileSpaceSelection, {
            x: tile.tileX,
            y: tile.tileY,
        });
        console.log("New path: ", newPath);
        if (newPath.length > 0) {
            this.path = [
                { x: this.tileSpaceSelection.x, y: this.tileSpaceSelection.y },
                ...newPath,
            ];
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
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.tileSpaceSelection.x,
            y: this.tileSpaceSelection.y,
        });

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

            if (!pointEquals(pathItem, this.tileSpaceSelection)) {
                context.drawRectangle({
                    x: pathWorldPosition.x + TileSize / 2 - 5,
                    y: pathWorldPosition.y + TileSize / 2 - 5,
                    width: 8,
                    height: 8,
                    fill: "purple",
                });
            }
        }
    }
}
