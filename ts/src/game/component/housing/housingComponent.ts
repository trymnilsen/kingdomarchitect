import { generateId } from "../../../common/idGenerator.js";
import { firstChildWhere } from "../../entity/child/first.js";
import { Entity } from "../../entity/entity.js";
import { workerPrefab } from "../../prefab/workerPrefab.js";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";

export class HousingComponent extends EntityComponent {
    residentId: string | null = null;
}
