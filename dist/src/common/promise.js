/* eslint-disable @typescript-eslint/no-empty-function */ /* eslint-disable @typescript-eslint/no-unused-vars */ function _define_property(obj, key, value) {
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
import { Event } from "./event.js";
export class Completer {
    get promise() {
        return this._promise;
    }
    resolveWith(value) {}
    rejectWith(value) {}
    dispose() {
        this.resolvedEvent.dispose();
        this.rejectedEvent.publish("completer was disposed");
    }
    constructor(){
        _define_property(this, "resolvedEvent", void 0);
        _define_property(this, "rejectedEvent", void 0);
        _define_property(this, "_promise", void 0);
        this.resolvedEvent = new Event();
        this.rejectedEvent = new Event();
        this._promise = new Promise((resolve, reject)=>{
            this.resolvedEvent.listenOnce(resolve);
            this.rejectedEvent.listenOnce(reject);
        });
    }
}
export function timeout(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
