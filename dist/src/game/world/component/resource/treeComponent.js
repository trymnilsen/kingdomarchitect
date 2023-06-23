function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../asset/sprite.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";
export var TreeComponentChopState;
(function(TreeComponentChopState) {
    TreeComponentChopState[TreeComponentChopState["Chopping"] = 0] = "Chopping";
    TreeComponentChopState[TreeComponentChopState["Full"] = 1] = "Full";
})(TreeComponentChopState || (TreeComponentChopState = {}));
export class TreeComponent extends EntityComponent {
    startChop() {
        this.chopState = TreeComponentChopState.Chopping;
    }
    finishChop() {
        this.chopTime = this.previousTick;
        this.entity?.remove();
    }
    onUpdate(tick) {
        this.previousTick = tick;
    }
    onDraw(context, screenPosition) {
        const health = this.entity?.getComponent(HealthComponent);
        if (!health) {
            console.warn("No health component");
        }
        let sprite = sprites2.tree_1;
        if (this.tree >= 2.0) {
            sprite = sprites2.tree_2;
        }
        if (this.tree >= 3.0) {
            sprite = sprites2.tree_3;
        }
        if (!!this.chopTime) {
            sprite = sprites2.tree_stub;
        }
        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 4,
            y: screenPosition.y
        });
    }
    constructor(tree){
        super();
        _define_property(this, "tree", void 0);
        _define_property(this, "chopTime", void 0);
        _define_property(this, "previousTick", void 0);
        _define_property(this, "chopState", void 0);
        this.tree = tree;
        this.previousTick = 0;
        this.chopState = TreeComponentChopState.Full;
    }
}
