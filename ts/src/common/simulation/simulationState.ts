import { EventHandle } from "../event/event";

export enum Operation {
    Create,
    Update,
    Delete
}

class StateNode {
    public set() { }
    public push() { }
    public clear() { }
}
