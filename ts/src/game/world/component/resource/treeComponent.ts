import { sprites2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";
import { HealthComponent } from "../health/healthComponent";

export class TreeComponent extends EntityComponent {
    private chopTime?: number;
    private previousTick: number = 0;
    constructor(private tree: number) {
        super();
    }

    setChopped() {
        this.chopTime = this.previousTick;
    }

    override onUpdate(tick: number): void {
        this.previousTick = tick;
        if (!!this.chopTime) {
            const timeDifference = tick - this.chopTime;
            if (timeDifference > 30) {
                this.chopTime = undefined;
                const health = this.entity?.getComponent(HealthComponent)!;
                health.healToMax();
            }
        }
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        const health = this.entity?.getComponent(HealthComponent);

        if (!health) {
            console.warn("No health component");
        }

        let sprite = sprites2.tree_1;
        if (this.tree >= 2.0) {
            sprite = sprites2.tree_2;
        }
        if (this.tree >= 3.0) {
            sprite = sprites2.tree_3;
        }

        if (!!this.chopTime) {
            sprite = sprites2.tree_stub;
        }

        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 4,
            y: screenPosition.y,
        });
    }
}
