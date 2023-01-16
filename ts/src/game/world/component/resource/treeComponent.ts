import { sprites } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";

export class TreeComponent extends EntityComponent {
    constructor(private tree: number) {
        super();
    }
    override onDraw(context: RenderContext, screenPosition: Point): void {
        let sprite = sprites.tree;
        if (this.tree >= 2.0) {
            sprite = sprites.tree2;
        }
        if (this.tree >= 3.0) {
            sprite = sprites.tree3;
        }
        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 4,
            y: screenPosition.y,
        });
    }
}
