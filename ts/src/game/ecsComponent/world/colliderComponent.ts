import { EcsComponent } from "../../../ecs/ecsComponent.js";

export class ColliderComponent extends EcsComponent {
    constructor(
        public width: number = 0,
        public height: number = 0,
    ) {
        super();
    }
}
