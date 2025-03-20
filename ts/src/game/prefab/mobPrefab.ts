import { sprites2 } from "../../module/asset/sprite.js";
import { IdleMobComponent } from "../component/actor/mob/IdleMobComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../component/actor/mob/aggroComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { DestroyOnZeroHealthComponent } from "../component/health/destroyOnZeroHealthComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { StaticSelectionInfoProvider } from "../component/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../component/selection/selectionInfoComponent.js";
import { Entity } from "../entity/entity.js";

export function mobPrefab(id: string): Entity {
    const goblin = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.goblin,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );
    const aggroComponent = new AggroComponent(2);
    aggroComponent.aggroMode = AggroMode.Agressive;
    const jobRunnerComponent = new JobRunnerComponent();
    const idleMobComponent = new IdleMobComponent();
    const healthComponent = new HealthComponent(100, 100);
    const selectionInfo = new SelectionInfoComponent(
        new StaticSelectionInfoProvider(sprites2.goblin, "Goblin", "Hostile"),
    );
    jobRunnerComponent.isOpenForExternalJobs = false;

    goblin.addComponent(idleMobComponent);
    goblin.addComponent(jobRunnerComponent);
    goblin.addComponent(spriteDrawer);
    goblin.addComponent(healthComponent);
    goblin.addComponent(aggroComponent);
    goblin.addComponent(selectionInfo);
    goblin.addComponent(new DestroyOnZeroHealthComponent());

    return goblin;
}
