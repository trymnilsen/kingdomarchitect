import { JobRunnerComponent } from "../componentOld/job/jobRunnerComponent.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { WorkerBehaviorComponent } from "../componentOld/behavior/workerBehaviorComponent.js";
import { Entity } from "../entity/entity.js";
import { sprites2 } from "../../module/asset/sprite.js";
import { EquipmentComponent } from "../componentOld/inventory/equipmentComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../componentOld/actor/mob/aggroComponent.js";
import { MovementComponent } from "../componentOld/movement/movementComponent.js";
import { EnergyComponent } from "../componentOld/energy/energyComponent.js";
import { WorkerSpriteComponent } from "../componentOld/actor/mob/workerSpriteComponent.js";
import { EffectComponent } from "../componentOld/effect/effectComponent.js";
import { VisibilityComponent } from "../componentOld/visibility/visibilityComponent.js";
import { largeDiamondPattern } from "../../common/pattern.js";
import { zeroPoint } from "../../common/point.js";
import {
    defaultInventoryItems,
    InventoryComponent2,
} from "../componentOld/inventory/inventoryComponent.js";
import { SelectionInfoComponent } from "../componentOld/selection/selectionInfoComponent.js";
import { WorkerSelectionProvider } from "../interaction/state/selection/actor/provider/workerSelectionProvider.js";
import { WorkerSelectionInfoProvider } from "../componentOld/selection/provider/workerSelectionInfoProvider.js";
import { SpriteStateMachine } from "../componentOld/draw/spriteProvider/statemachine/spriteStateMachine.js";
import { SpriteAction } from "../componentOld/draw/spriteProvider/statemachine/spriteAction.js";
import { knightSpriteFactory } from "../componentOld/draw/factory/knightSpriteFactory.js";

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
        new SpriteComponent(
            sprites2.bowman,
            { x: 2, y: 0 },
            {
                x: 32,
                y: 32,
            },
        ),
    );
    worker.addComponent(healthComponent);
    worker.addComponent(effectComponent);
    worker.addComponent(visibilityComponent);
    worker.addComponent(inventoryComponent);

    return worker;
}
