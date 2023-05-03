import { Sprite2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";

export class BuildingComponent extends EntityComponent {
    private buildingSprite: Sprite2;
    private scaffoldSprite: Sprite2;
    private isScaffolded: boolean = true;
    constructor(buildingSprite: Sprite2, scaffoldSprite: Sprite2) {
        super();
        this.buildingSprite = buildingSprite;
        this.scaffoldSprite = scaffoldSprite;
    }

    finishBuild() {
        this.isScaffolded = false;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        let sprite = this.buildingSprite;
        if (this.isScaffolded) {
            sprite = this.scaffoldSprite;
        }
        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 3,
            y: screenPosition.y + 2,
            targetWidth: 32,
            targetHeight: 32,
        });
    }
}
