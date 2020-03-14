"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Event {
    constructor() {
        this.nextListenersId = 0;
        this.listeners = {};
    }
    listen(subscriber) {
        const listnerId = this.nextListenersId + 1;
        this.listeners[listnerId] = subscriber;
        return () => {
            delete this.listeners[listnerId];
        };
    }
    publish(data) {
        Object.values(this.listeners).forEach((listener, idx) => {
            try {
                listener(data);
            }
            catch (err) {
                console.error(`Failed to run event listener #${idx} ${listener.name}`, err);
            }
        });
    }
    dispose() {
        this.listeners = {};
    }
}
exports.Event = Event;
//# sourceMappingURL=event.js.map