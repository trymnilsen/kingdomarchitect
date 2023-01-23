import { Event } from "./event";

export class Completer<T> {
    private resolvedEvent: Event<T>;
    private rejectedEvent: Event<any>;
    private _promise: Promise<T>;

    public get promise(): Promise<T> {
        return this._promise;
    }

    constructor() {
        this.resolvedEvent = new Event<T>();
        this.rejectedEvent = new Event<void>();
        this._promise = new Promise<T>((resolve, reject) => {
            this.resolvedEvent.listenOnce(resolve);
            this.rejectedEvent.listenOnce(reject);
        });
    }

    resolveWith(value: T) {}

    rejectWith(value: any) {}

    dispose() {
        this.resolvedEvent.dispose();
        this.rejectedEvent.publish("completer was disposed");
    }
}

export function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
