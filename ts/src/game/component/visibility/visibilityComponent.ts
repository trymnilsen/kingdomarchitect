import { EventHandle } from "../../../common/event.js";
import {
    diamondPattern,
    largeDiamondPattern,
} from "../../../common/pattern.js";
import { Point } from "../../../common/point.js";
import { EntityEvent } from "../../entity/entityEvent.js";
import { EntityComponent, StatelessComponent } from "../entityComponent.js";
import { VisibilityShape } from "./visibilityShape.js";

type VisibilityBundle = {
    shape: Point[];
    position: Point;
};

export class VisibilityComponent extends EntityComponent<VisibilityBundle> {
    private shape: VisibilityShape = new VisibilityShape();
    private entityEventHandle: EventHandle | null = null;

    getVisibility(): Point[] {
        return this.shape.getPoints();
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

    override fromComponentBundle(bundle: VisibilityBundle): void {
        this.shape.updatePattern(bundle.shape);
        this.shape.updatePoint(bundle.position);
    }
    override toComponentBundle(): VisibilityBundle {
        return {
            shape: this.shape.pattern,
            position: this.shape.point,
        };
    }

    static createInstance(
        shape: Point[],
        position: Point,
    ): VisibilityComponent {
        const instance = new VisibilityComponent();
        instance.fromComponentBundle({
            position: position,
            shape: shape,
        });
        return instance;
    }

    private onEntityEvent(event: EntityEvent) {
        if (event.id == "transform" && event.source == this.entity) {
            this.shape.updatePoint(this.entity.worldPosition);
        }
    }
}
