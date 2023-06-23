function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { InvalidArgumentError } from "../error/invalidArgumentError.js";
/**
 * An event that allows listening for a specific event type.
 * Discrimination is done based on the name of the constructor for the type.
 * Two different classes with the same name will be treated as the same type
 * and listeners will trigger for both of the classes. Uses and loops through
 * a list to handle subscriptions so its not optimised for a lot of
 * listeners but this should not be a common occurence.
 */ export class TypedEvent {
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
     */ listen(filterType, subscriber) {
        const typename = filterType.name;
        const listenerId = this.getNextListenerId();
        const subscription = {
            handleId: listenerId,
            typeName: typename,
            handler: subscriber
        };
        this.subscriptions.push(subscription);
        const handle = new TypedEventHandle(this, listenerId);
        return handle;
    }
    /**
     * Publish an event to potential publishers, the type of the data class
     * will be used to select the applicable subscribers
     * @param data The data to publish to subscriber
     */ publish(data) {
        const typeName = Object.getPrototypeOf(data)?.constructor?.name;
        if (!typeName) {
            throw new InvalidArgumentError("Data had no constructor name");
        }
        for(let i = 0; i < this.subscriptions.length; i++){
            const item = this.subscriptions[i];
            if (typeName == item.typeName) {
                try {
                    item.handler(data);
                } catch (err) {
                    console.error("Failed running event subscriber", err);
                }
            }
        }
    }
    /**
     * Remove a subscriber for the list of listeners
     * @param handleId the id of the subscription to remove
     */ removeListener(handleId) {
        this.subscriptions = this.subscriptions.filter((item)=>{
            item.handleId != handleId;
        });
    }
    getNextListenerId() {
        this.nextListenersId++;
        return this.nextListenersId.toString();
    }
    constructor(){
        _define_property(this, "nextListenersId", 0);
        _define_property(this, "subscriptions", []);
    }
}
/**
 * Represents a single subscription for an event.
 * Allows checking if the subscription is active and disposing the subscription
 */ export class TypedEventHandle {
    get isDisposed() {
        return this._isDisposed;
    }
    dispose() {
        this.event.removeListener(this.handleId);
    }
    constructor(event, handleId){
        _define_property(this, "event", void 0);
        _define_property(this, "handleId", void 0);
        _define_property(this, "_isDisposed", void 0);
        this.event = event;
        this.handleId = handleId;
        this._isDisposed = false;
    }
}
