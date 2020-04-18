import { Event, EventListener } from "../event/event";

export class GameState {
    public get stateUpdated(): EventListener<void> {
        return this._stateUpdated;
    }

    private _stateUpdated: Event<void>;

    constructor() {
        this._stateUpdated = new Event();
    }
}
