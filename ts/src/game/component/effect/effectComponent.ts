import { JSONValue } from "../../../common/object.js";
import { Effect } from "../../../data/effect/effect.js";
import { EntityComponent } from "../entityComponent.js";
import { effectProcList } from "./effectProcList.js";

export class EffectComponent extends EntityComponent {
    private activeEffects: Effect[] = [];

    addEffect(effect: Effect) {
        this.activeEffects.push(effect);
    }

    override onUpdate(_tick: number): void {
        const removableEffects: Effect[] = [];
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            const proc = effectProcList[effect.id];
            if (!!proc) {
                const procResult = proc(effect, this.entity);

                if (procResult) {
                    this.activeEffects.splice(i, 1);
                    continue;
                }
            }

            effect.time -= 1;
            if (effect.time <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }
}
