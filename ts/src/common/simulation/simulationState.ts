import { EventHandle } from "../event/event";

export enum Operation {
    Create,
    Update,
    Delete
}
export class SimulationState {
    public listen(path: string, operation: Operation): EventHandle {}
    public get(path: string) {}
}

class StateNode {
    public set() {}
    public push() {}
    public clear() {}
}
