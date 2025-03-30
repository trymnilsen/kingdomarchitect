import { generateId } from "../../../common/idGenerator.js";
import { firstChildWhere } from "../../entity/child/first.js";
import { foxPrefab } from "../../prefab/foxPrefab.js";
import { FoxComponent } from "../actor/animal/foxComponent.js";
import { EntityComponent } from "../entityComponent.js";

export class ForrestComponent extends EntityComponent {
    override onUpdate(tick: number): void {
        if (tick % 60 == 0) {
            const foxes = firstChildWhere(this.entity, (child) => {
                const hasFoxComponent = child.getComponent(FoxComponent);
                return !!hasFoxComponent;
            });

            if (!foxes) {
                const fox = foxPrefab(generateId("fox"));
                this.entity.addChild(fox);
            }
        }
    }
}
