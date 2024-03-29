import { TypedEventHandle } from "../../../common/event/typedEvent.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthEvent } from "./healthEvent.js";

export class DestroyOnZeroHealthComponent extends EntityComponent {
    private healthEventHandle: TypedEventHandle | undefined;
    override onStart(): void {
        this.healthEventHandle = this.entity.componentEvents.listen(
            HealthEvent,
            (event) => {
                if (event.newHealth === 0) {
                    this.entity.remove();
                }
            },
        );
    }

    override onStop(): void {
        this.healthEventHandle?.dispose();
    }
}
