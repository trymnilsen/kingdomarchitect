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
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { World } from "./world/world.js";
export class MainScene {
    tick(tick) {
        /*for (const routine of spawnRoutines) {
            //routine(tick, this.world);
        }*/ this.world.tick(tick);
        this.interactionHandler.onUpdate(tick);
    }
    onTapUp(tapEndEvent) {
        this.interactionHandler.onTapUp(tapEndEvent);
    }
    onTapDown(screenPoint) {
        return this.interactionHandler.onTapDown(screenPoint);
    }
    onTapPan(movement, position, startPoint) {
        this.interactionHandler.onTapPan(movement, position, startPoint);
    }
    input(action) {
        this.interactionHandler.onInput(action);
    }
    drawScene(context) {
        this.world.onDraw(context);
        this.interactionHandler.onDraw(context);
    }
    constructor(camera, assetsLoader, gameTime){
        _define_property(this, "world", void 0);
        _define_property(this, "interactionHandler", void 0);
        this.world = new World();
        //this.world.invalidateWorld();
        this.interactionHandler = new InteractionHandler(this.world, camera, assetsLoader, gameTime);
    }
}
