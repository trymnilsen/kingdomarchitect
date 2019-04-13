import { Point } from "../../../common/data/point";

export class Camera {
    private cameraPosition: Point;

    public set position(position: Point) {
        this.cameraPosition = position;
    }

    public get position(): Point {
        return this.cameraPosition;
    }
}
