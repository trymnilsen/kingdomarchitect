import { Point } from "../../../common/point.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { EntityComponent } from "../entityComponent.js";

export class MountainComponent extends EntityComponent {
    override onDraw(
        context: RenderScope,
        _screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
    ): void {
        context.drawRectangle({
            x: this.entity.worldPosition.x * 40 + 3,
            y: this.entity.worldPosition.y * 40 + 3,
            fill: "#9a9c9a",
            height: 32,
            width: 32,
        });
    }
}
