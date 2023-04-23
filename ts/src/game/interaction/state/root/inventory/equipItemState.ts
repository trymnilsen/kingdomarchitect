import { RenderContext } from "../../../../../rendering/renderContext";
import { WorkerBehaviorComponent } from "../../../../world/component/behavior/workerBehaviorComponent";
import { Entity } from "../../../../world/entity/entity";
import { InteractionState } from "../../../handler/interactionState";

export class EquipItemState extends InteractionState {
    override onDraw(context: RenderContext): void {
        super.onDraw(context);
        context.drawScreenSpaceRectangle({
            x: 0,
            y: 0,
            width: context.width,
            height: context.height,
            fill: "rgba(20, 20, 20, 0.8)",
        });

        this.drawWorker(context, this.context.world.rootEntity);
    }

    private drawWorker(context: RenderContext, worker: Entity) {
        const workerComponent = worker.getComponent(WorkerBehaviorComponent);
        if (!!workerComponent) {
            worker.onDraw(context);
            const screenPosition = context.camera.tileSpaceToScreenSpace(
                worker.worldPosition
            );

            context.drawText({
                text: "Philip",
                x: screenPosition.x,
                y: screenPosition.y + 40,
                color: "white",
                font: "Silkscreen",
                size: 16,
            });
        }

        for (const childWorker of worker.children) {
            this.drawWorker(context, childWorker);
        }
    }
}
