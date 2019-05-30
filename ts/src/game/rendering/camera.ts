import { Point } from "../../data/point";

export class Camera {
    private cameraPosition: Point;

    public constructor() {
        this.cameraPosition = { x: 0, y: 0 };
    }
    public get screenPosition(): Point {
        return {
            x: this.cameraPosition.x + window.innerWidth / 2,
            y: this.cameraPosition.y + window.innerHeight / 2
        };
    }
    public set position(position: Point) {
        this.cameraPosition = position;
    }

    public get position(): Point {
        return this.cameraPosition;
    }
}
