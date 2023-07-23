import {
    EventHandle,
    EventListener,
    EventSubscriptionHandler,
} from "../event.js";

export enum LifecycleStatus {
    Alive,
    Stopped,
}
export class Lifecycle implements EventListener<LifecycleStatus> {
    listen(subscriber: EventSubscriptionHandler<LifecycleStatus>): EventHandle {
        throw new Error("Method not implemented.");
    }
    listenOnce(
        subscriber: EventSubscriptionHandler<LifecycleStatus>
    ): EventHandle {
        throw new Error("Method not implemented.");
    }
}
