import { ConstructorFunction, getConstructorName } from "../constructor.js";
import { EventSubscriptionHandler } from "../event.js";

/**
 * An event that allows listening for a specific event type.
 * Discrimination is done based on the name of the constructor for the type.
 * Two different classes with the same name will be treated as the same type
 * and listeners will trigger for both of the classes. Uses and loops through
 * a list to handle subscriptions so its not optimised for a lot of
 * listeners but this should not be a common occurence.
 */
export class TypedEvent<TBaseEvent extends object> {
    private nextListenersId = 0;
    private subscriptions: TypedEventSubscription<TBaseEvent>[] = [];

    /**
     * Listen for a specific event with the given type
     *
     * Example:
     * ```
     * // Note the lack of new or parantheis after the class name
     * .listen(EventClass, (e: EventClass) => { ... })
     * ```
     *
     * @param filterType the constructor of the type to listen for
     * @param subscriber the callback to invoke when an event is published
     * @returns a handle that can be used to dispose the subscription
     */
    listen<TEventFilter extends TBaseEvent>(
        filterType: ConstructorFunction<TEventFilter>,
        subscriber: EventSubscriptionHandler<TEventFilter>,
    ): TypedEventHandle {
        const typename = filterType.name;
        const listenerId = this.getNextListenerId();
        const subscription: TypedEventSubscription<TBaseEvent> = {
            handleId: listenerId,
            typeName: typename,
            handler: subscriber as EventSubscriptionHandler<TBaseEvent>,
        };
        this.subscriptions.push(subscription);
        const handle = new TypedEventHandle(() => {
            this.removeListener(listenerId);
        });
        return handle;
    }

    /**
     * Publish an event to potential publishers, the type of the data class
     * will be used to select the applicable subscribers
     * @param data The data to publish to subscriber
     */
    publish(data: TBaseEvent) {
        const typeName = getConstructorName(data);
        for (const subscription of this.subscriptions) {
            if (typeName == subscription.typeName) {
                try {
                    subscription.handler(data);
                } catch (err) {
                    console.error("Failed running event subscriber", err);
                }
            }
        }
    }

    /**
     * Remove a subscriber for the list of listeners
     * @param handleId the id of the subscription to remove
     */
    removeListener(handleId: string) {
        this.subscriptions = this.subscriptions.filter((item) => {
            item.handleId != handleId;
        });
    }

    private getNextListenerId(): string {
        this.nextListenersId++;
        return this.nextListenersId.toString();
    }
}

/**
 * Represents a single subscription for an event.
 * Allows checking if the subscription is active and disposing the subscription
 */
export class TypedEventHandle {
    constructor(private disposeHandle: () => void) {}

    dispose() {
        this.disposeHandle();
    }
}

type TypedEventSubscription<T> = {
    handleId: string;
    typeName: string;
    handler: EventSubscriptionHandler<T>;
};
