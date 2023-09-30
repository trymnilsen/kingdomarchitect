import { sprites2 } from "../../asset/sprite.js";
import { IdleMobComponent } from "../component/actor/mob/IdleMobComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../component/actor/mob/aggroComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { DestroyOnZeroHealthComponent } from "../component/health/destroyOnZeroHealthComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { Entity } from "../entity/entity.js";

export function mobPrefab(id: string): Entity {
    const goblin = new Entity(id);
    const spriteDrawer = SpriteComponent.createInstance(
        sprites2.goblin,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );
    const aggroComponent = AggroComponent.createInstance(1);
    aggroComponent.aggroMode = AggroMode.Agressive;
    const jobRunnerComponent = new JobRunnerComponent();
    const idleMobComponent = new IdleMobComponent();
    const healthComponent = HealthComponent.createInstance(100, 100);
    jobRunnerComponent.isOpenForExternalJobs = false;

    goblin.addComponent(idleMobComponent);
    goblin.addComponent(jobRunnerComponent);
    goblin.addComponent(spriteDrawer);
    goblin.addComponent(healthComponent);
    goblin.addComponent(aggroComponent);
    goblin.addComponent(new DestroyOnZeroHealthComponent());

    return goblin;
}
