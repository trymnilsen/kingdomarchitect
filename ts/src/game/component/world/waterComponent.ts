import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { EntityComponent } from "../entityComponent.js";

export class WaterComponent extends EntityComponent {
    override onDraw(
        context: RenderContext,
        _screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
    ): void {
        context.drawRectangle({
            x: this.entity.worldPosition.x * 40 + 3,
            y: this.entity.worldPosition.y * 40 + 3,
            fill: "#2347cc",
            height: 32,
            width: 32,
        });
    }
}
