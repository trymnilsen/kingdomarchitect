import { EventHandle } from "../../../common/event.js";
import {
    diamondPattern,
    largeDiamondPattern,
} from "../../../common/pattern.js";
import { Point } from "../../../common/point.js";
import { EntityEvent } from "../../entity/entityEvent.js";
import { EntityComponent } from "../entityComponent.js";
import { VisibilityShape } from "./visibilityShape.js";

export class VisibilityComponent extends EntityComponent {
    private shape: VisibilityShape = new VisibilityShape();
    private entityEventHandle: EventHandle | null = null;

    getVisibility(): Point[] {
        return this.shape.getPoints();
    }

    constructor(shape: Point[], position: Point) {
        super();
        this.shape.updatePattern(shape);
        this.shape.updatePoint(position);
    }

    override onStart(): void {
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

    private onEntityEvent(event: EntityEvent) {
        if (event.id == "transform" && event.source == this.entity) {
            this.shape.updatePoint(this.entity.worldPosition);
        }
    }
}
