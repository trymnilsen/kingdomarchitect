import { EntityComponent } from "../../../src/game/component/entityComponent.js";

/**
 * A stub of a component for use with testing
 */
export class StubComponent extends EntityComponent {
    constructor(
        private callbacks?: {
            onStart?: () => void;
            onStop?: () => void;
        }
    ) {
        super();
    }

    override onStart(tick: number): void {
        if (this.callbacks?.onStart) {
            this.callbacks.onStart();
        }
    }

    override onStop(tick: number): void {
        if (this.callbacks?.onStop) {
            this.callbacks.onStop();
        }
    }
}
