import { generateId } from "../../../common/idGenerator";
import { firstChildWhere } from "../../entity/child/first";
import { foxPrefab } from "../../prefab/foxPrefab";
import { FoxComponent } from "../actor/animal/foxComponent";
import { StatelessComponent } from "../entityComponent";

export class ForrestComponent extends StatelessComponent {
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
