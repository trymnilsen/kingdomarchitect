export class Event<T = {}> {
    private nextListenersId = 0;
    private listeners: { [id: string]: EventSubscriptionHandler<T> } = {};
    public listen(subscriber: EventSubscriptionHandler<T>): EventHandle {
        const listnerId = this.nextListenersId + 1;
        this.listeners[listnerId] = subscriber;
        return () => {
            delete this.listeners[listnerId];
        };
    }
    public publish(data: T): void {
        Object.values(this.listeners).forEach((listener) => {
            listener(data);
        });
    }
    public dispose(): void {
        this.listeners = {};
    }
}
export interface EventListener<T> {
    listen(subscriber: EventSubscriptionHandler<T>): EventHandle;
}
export interface EventPublisher<T> {
    publish(data: T): void;
}

export type EventSubscriptionHandler<T> = (data: T) => void;
export type EventHandle = () => void;
