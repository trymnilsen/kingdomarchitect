import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { Entity } from "../entity/entity.js";
import { sprites2 } from "../../asset/sprite.js";
import { EquipmentComponent } from "../component/inventory/equipmentComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../component/actor/mob/aggroComponent.js";
import { MovementComponent } from "../component/movement/movementComponent.js";
import { EnergyComponent } from "../component/energy/energyComponent.js";
import { WorkerSpriteComponent } from "../component/actor/mob/workerSpriteComponent.js";
import { EffectComponent } from "../component/effect/effectComponent.js";
import { VisibilityComponent } from "../component/visibility/visibilityComponent.js";
import { largeDiamondPattern } from "../../common/pattern.js";
import { zeroPoint } from "../../common/point.js";
import {
    defaultInventoryItems,
    InventoryComponent2,
} from "../component/inventory/inventoryComponent.js";
import { SelectionInfoComponent } from "../component/selection/selectionInfoComponent.js";
import { WorkerSelectionProvider } from "../interaction/state/selection/actor/provider/workerSelectionProvider.js";
import { WorkerSelectionInfoProvider } from "../component/selection/provider/workerSelectionInfoProvider.js";
import { SpriteStateMachine } from "../component/draw/spriteProvider/statemachine/spriteStateMachine.js";
import { SpriteAction } from "../component/draw/spriteProvider/statemachine/spriteAction.js";
import { knightSpriteFactory } from "../component/draw/factory/knightSpriteFactory.js";

export function workerPrefab(id: string): Entity {
    const worker = new Entity(id);

    const jobRunner = new JobRunnerComponent();
    const workerBehaviorComponent = new WorkerBehaviorComponent();
    const equipmentComponent = new EquipmentComponent();
    const movementComponent = new MovementComponent();
    const energyComponent = new EnergyComponent();
    const effectComponent = new EffectComponent();
    const visibilityComponent = new VisibilityComponent(
        largeDiamondPattern,
        zeroPoint(),
    );
    const inventoryComponent = new InventoryComponent2(defaultInventoryItems());
    energyComponent.setEnergy(10000);
    const healthComponent = new HealthComponent(100, 100);
    const aggroComponent = new AggroComponent(5);
    aggroComponent.aggroMode = AggroMode.Defensive;
    worker.addComponent(jobRunner);
    worker.addComponent(workerBehaviorComponent);
    worker.addComponent(equipmentComponent);
    worker.addComponent(aggroComponent);
    worker.addComponent(movementComponent);
    worker.addComponent(energyComponent);
    worker.addComponent(
        new SelectionInfoComponent(new WorkerSelectionInfoProvider()),
    );
    worker.addComponent(new SpriteStateMachine(knightSpriteFactory));
    worker.addComponent(
        new SpriteComponent(sprites2.bowman, zeroPoint(), {
            x: 32,
            y: 32,
        }),
    );
    worker.addComponent(healthComponent);
    worker.addComponent(effectComponent);
    worker.addComponent(visibilityComponent);
    worker.addComponent(inventoryComponent);

    return worker;
}
