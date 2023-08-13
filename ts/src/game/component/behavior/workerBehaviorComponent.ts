import { ComponentFactory, EntityComponent } from "../entityComponent.js";

export class WorkerBehaviorComponent extends EntityComponent {
    override factory(): ComponentFactory {
        return () => new WorkerBehaviorComponent();
    }
}
