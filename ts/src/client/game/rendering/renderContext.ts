import { Camera } from "./camera";

export class RenderContext {
    private activeCamera: Camera;
    public get camera(): Camera {
        return this.activeCamera;
    }

    public set camera(camera: Camera) {
        this.activeCamera = camera;
    }
}
