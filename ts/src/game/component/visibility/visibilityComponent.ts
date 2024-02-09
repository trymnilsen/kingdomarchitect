import { EventHandle } from "../../../common/event.js";
import { diamondPattern } from "../../../common/pattern.js";
import { Point } from "../../../common/point.js";
import { EntityEvent } from "../../entity/entityEvent.js";
import { StatelessComponent } from "../entityComponent.js";
import { VisibilityShape } from "./visibilityShape.js";

export class VisibilityComponent extends StatelessComponent {
    private shape: VisibilityShape = new VisibilityShape();
    private entityEventHandle: EventHandle | null = null;

    override onStart(): void {
        this.shape.updatePattern(diamondPattern);
        this.shape.updatePoint(this.entity.worldPosition);
        this.entityEventHandle = this.entity.entityEvents.listen((event) => {
            this.onEntityEvent(event);
        });
    }

    override onStop(): void {
        if (this.entityEventHandle) {
            this.entityEventHandle();
        }
    }

    getVisibility(): Point[] {
        return this.shape.getPoints();
    }

    private onEntityEvent(event: EntityEvent) {
        if (event.id == "transform" && event.source == this.entity) {
            this.shape.updatePoint(this.entity.worldPosition);
        }
    }
}
