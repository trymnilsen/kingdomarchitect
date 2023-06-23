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
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { ChopTreeJob } from "../../../world/job/jobs/chopTreeJob.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
export class ChopJobState extends InteractionState {
    onActive() {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize
        });
        const scaffoldView = new UIActionbarScaffold(contentView, [
            {
                text: "Confirm",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.scheduleChop();
                }
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.context.stateChanger.pop(null);
                }
            }
        ], [], {
            width: fillUiSize,
            height: fillUiSize
        });
        this.view = scaffoldView;
    }
    onDraw(context) {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selection.tilePosition.x,
            y: this.selection.tilePosition.y
        });
        context.drawSprite({
            sprite: sprites2.cursor,
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2
        });
        super.onDraw(context);
    }
    scheduleChop() {
        console.log("Schedule chop tree job");
        this.context.world.jobQueue.schedule(new ChopTreeJob(this.selection));
        console.log("Clear state changer job");
        this.context.stateChanger.clear();
    }
    constructor(selection){
        super();
        _define_property(this, "selection", void 0);
        this.selection = selection;
    }
}
