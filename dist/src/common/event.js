/**
 * An event allows modeling updates to data.
 * You can listen to updates or publish them.
 */ function _define_property(obj, key, value) {
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
export class Event {
    listen(subscriber) {
        const listnerId = this.nextListenersId + 1;
        this.listeners[listnerId] = subscriber;
        return ()=>{
            delete this.listeners[listnerId];
        };
    }
    listenOnce(subscriber) {
        const handle = this.listen((data)=>{
            // Remove the listener after the first value
            handle();
            subscriber(data);
        });
        return handle;
    }
    publish(data) {
        Object.values(this.listeners).forEach((listener, idx)=>{
            try {
                listener(data);
            } catch (err) {
                console.error(`Failed to run event listener #${idx} ${listener.name}`, err);
            }
        });
    }
    /**
     * Dispose the event, removing all listeners
     */ dispose() {
        this.listeners = {};
    }
    constructor(){
        _define_property(this, "nextListenersId", 0);
        _define_property(this, "listeners", {});
    }
}
/**
 * Allows wrapping another event that can be updated after it has been created,
 * gracefully handling changing the underlying event without the listeners
 * knowing or leaking.
 */ export class ForwardEvent {
    listen(subscriber) {
        return this._listenable.listen(subscriber);
    }
    listenOnce(subscriber) {
        return this._listenable.listenOnce(subscriber);
    }
    /**
     * Update the source event we are listening to and forwarding
     * @param event the event instance we are fowarding
     */ setSource(event) {
        //Clear the current source before setting a new one
        this.clearSource();
        this._sourceHandle = event.listen((data)=>{
            this._listenable.publish(data);
        });
    }
    /**
     * Clear the set source event we are listening on.
     * Removing listeners for it.
     */ clearSource() {
        if (this._sourceHandle != null) {
            this._sourceHandle();
        }
    }
    /**
     * Dispose the forward event, this will remove all listeners.
     */ dispose() {
        this.clearSource();
        this._listenable.dispose();
    }
    constructor(){
        _define_property(this, "_sourceHandle", void 0);
        _define_property(this, "_listenable", void 0);
        this._sourceHandle = null;
        this._listenable = new Event();
    }
}
