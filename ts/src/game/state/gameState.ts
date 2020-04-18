import { Event, EventListener } from "../../event/event";
import { Point, addPoint, changeX, changeY } from "../../data/point";
import { Direction } from "../../data/direction";

export type GameStateUpdatedNotifier = () => void;

export class GameState {
    playerState: PlayerState;
    constructor() {
        this.playerState = new PlayerState();
    }
}

export class PlayerState {
    position: Point;

    constructor() {
        this.position = { x: 0, y: 0 };
    }
}
