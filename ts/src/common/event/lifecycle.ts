import { EventHandle, EventListener } from "../event.js";

export enum LifecycleStatus {
    Alive,
    Stopped,
}

export class Lifecycle implements EventListener<LifecycleStatus> {
    listen(): EventHandle {
        throw new Error("Method not implemented.");
    }
    listenOnce(): EventHandle {
        throw new Error("Method not implemented.");
    }
}
