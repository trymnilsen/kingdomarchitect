import { sprites2 } from "../../asset/sprite.js";
import { FoxComponent } from "../component/actor/animal/foxComponent.js";
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

export function foxPrefab(id: string): Entity {
    const fox = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.fox,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );
    const aggroComponent = new AggroComponent(1);
    aggroComponent.aggroMode = AggroMode.Defensive;
    const jobRunnerComponent = new JobRunnerComponent();
    const idleMobComponent = new IdleMobComponent();
    const healthComponent = new HealthComponent(100, 100);
    jobRunnerComponent.isOpenForExternalJobs = false;

    fox.addComponent(idleMobComponent);
    fox.addComponent(jobRunnerComponent);
    fox.addComponent(spriteDrawer);
    fox.addComponent(healthComponent);
    fox.addComponent(aggroComponent);
    fox.addComponent(new FoxComponent());
    fox.addComponent(new DestroyOnZeroHealthComponent());

    return fox;
}
