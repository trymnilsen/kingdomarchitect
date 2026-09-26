import assert from "node:assert";
import { describe, it } from "node:test";
import { TypedEvent } from "../../src/common/event.ts";

class SampleEvent {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
}

describe("TypedEvent", () => {
    it("removeListener removes only the disposed subscription", () => {
        const event = new TypedEvent<object>();
        let a = 0;
        let b = 0;
        const handleA = event.listen(SampleEvent, () => a++);
        event.listen(SampleEvent, () => b++);

        handleA.dispose();
        event.publish(new SampleEvent(1));

        // The disposed listener must not fire. The other one must still fire.
        // Guards against the bug where removeListener wiped every subscription.
        assert.strictEqual(a, 0);
        assert.strictEqual(b, 1);
    });
});
