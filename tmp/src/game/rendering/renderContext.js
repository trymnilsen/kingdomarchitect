"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RenderContext {
    get camera() {
        return this.activeCamera;
    }
    set camera(camera) {
        this.activeCamera = camera;
    }
}
exports.RenderContext = RenderContext;
//# sourceMappingURL=renderContext.js.map