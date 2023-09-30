/**
 * An event allows modeling updates to data.
 * You can listen to updates or publish them.
 */
export class Event<T = object> implements EventListener<T> {
    private nextListenersId = 0;
    private listeners: { [id: string]: EventSubscriptionHandler<T> } = {};

    listen(subscriber: EventSubscriptionHandler<T>): EventHandle {
        const listnerId = this.nextListenersId + 1;
        this.listeners[listnerId] = subscriber;
        return () => {
            delete this.listeners[listnerId];
        };
    }

    listenOnce(subscriber: EventSubscriptionHandler<T>): EventHandle {
        const handle = this.listen((data) => {
            // Remove the listener after the first value
            handle();
            subscriber(data);
        });
        return handle;
    }

    publish(data: T): void {
        Object.values(this.listeners).forEach((listener, idx) => {
            try {
                listener(data);
            } catch (err) {
                console.error(
                    `Failed to run event listener #${idx} ${listener.name}`,
                    err,
                );
            }
        });
    }

    /**
     * Dispose the event, removing all listeners
     */
    dispose(): void {
        this.listeners = {};
    }
}

/**
 * Represent an event that can be listened to by other sources
 */
export interface EventListener<T> {
    /**
     * Listen to updates to this event. Each time an event is emitted the
     * provided subscriber is updated
     * @param subscriber function to be invoked on updates
     * @returns a function that can be called to remove the subscription
     */
    listen(subscriber: EventSubscriptionHandler<T>): EventHandle;

    /**
     * Listens for an update to the event. Once a single event has been emitted
     * the listener is removed from the underlaying event emitter.
     * @param subscriber the function to be called once on the next event
     * @returns a function that can be called to remove the subscripton. If this
     * is invoked after the first emit it has no effect.
     */
    listenOnce(subscriber: EventSubscriptionHandler<T>): EventHandle;
}

/**
 * A publisher of events without any ability to listen
 */
export interface EventPublisher<T> {
    publish(data: T): void;
}

/**
 * A function to be called each time the data of an event is updated
 */
export type EventSubscriptionHandler<T> = (data: T) => void;
/**
 * A function that when called will remove the subscription it is tied to from
 * the list of listeners on an event
 */
export type EventHandle = () => void;

/**
 * Allows wrapping another event that can be updated after it has been created,
 * gracefully handling changing the underlying event without the listeners
 * knowing or leaking.
 */
export class ForwardEvent<T> implements EventListener<T> {
    private _sourceHandle: EventHandle | null;
    private _listenable: Event<T>;
    constructor() {
        this._sourceHandle = null;
        this._listenable = new Event<T>();
    }

    listen(subscriber: EventSubscriptionHandler<T>): EventHandle {
        return this._listenable.listen(subscriber);
    }

    listenOnce(subscriber: EventSubscriptionHandler<T>): EventHandle {
        return this._listenable.listenOnce(subscriber);
    }

    /**
     * Update the source event we are listening to and forwarding
     * @param event the event instance we are fowarding
     */
    setSource(event: Event<T>) {
        //Clear the current source before setting a new one
        this.clearSource();
        this._sourceHandle = event.listen((data) => {
            this._listenable.publish(data);
        });
    }

    /**
     * Clear the set source event we are listening on.
     * Removing listeners for it.
     */
    clearSource() {
        if (this._sourceHandle != null) {
            this._sourceHandle();
        }
    }

    /**
     * Dispose the forward event, this will remove all listeners.
     */
    dispose(): void {
        this.clearSource();
        this._listenable.dispose();
    }
}
