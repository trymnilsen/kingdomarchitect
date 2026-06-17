import { describe, it } from "node:test";
import assert from "node:assert";
import { InteractionStateHistory } from "../../../src/game/interaction/handler/interactionStateHistory.ts";
import { InteractionState } from "../../../src/game/interaction/handler/interactionState.ts";
import type { StateContext } from "../../../src/game/interaction/handler/stateContext.ts";

// The history never calls into the context (only RootState.getView/getFocusGroups
// would, and those are not invoked here), so an empty stand-in is sufficient.
const fakeContext = {} as unknown as StateContext;

// Test double that records lifecycle calls. Extending the real base class keeps
// the `context` setter and onActive/onInactive contract intact.
class SpyState extends InteractionState {
    activeCount = 0;
    inactiveCount = 0;

    override onActive(): void {
        this.activeCount++;
    }

    override onInactive(): void {
        this.inactiveCount++;
    }
}

describe("InteractionStateHistory", () => {
    it("seeds a RootState so size starts at 1", () => {
        const history = new InteractionStateHistory(fakeContext);
        assert.strictEqual(history.size, 1);
    });

    it("push activates the new state, deactivates the previous, and grows the stack", () => {
        const history = new InteractionStateHistory(fakeContext);
        const pushed = new SpyState();

        history.push(pushed);

        assert.strictEqual(history.size, 2);
        assert.strictEqual(history.state, pushed);
        assert.strictEqual(pushed.activeCount, 1);
        assert.strictEqual(pushed.inactiveCount, 0);
    });

    it("replace swaps the top state and deactivates the replaced one", () => {
        const history = new InteractionStateHistory(fakeContext);
        const first = new SpyState();
        const replacement = new SpyState();
        history.push(first);

        history.replace(replacement);

        // Replacing does not grow the stack.
        assert.strictEqual(history.size, 2);
        assert.strictEqual(history.state, replacement);
        assert.strictEqual(first.inactiveCount, 1);
        assert.strictEqual(replacement.activeCount, 1);
    });

    it("replace at the root throws", () => {
        const history = new InteractionStateHistory(fakeContext);
        assert.throws(() => history.replace(new SpyState()));
    });

    it("pop returns to the previous state and fires the onPop callback", () => {
        const history = new InteractionStateHistory(fakeContext);
        const pushed = new SpyState();
        let popValue: unknown = undefined;
        history.push(pushed, (value) => {
            popValue = value;
        });

        history.pop("done");

        assert.strictEqual(history.size, 1);
        assert.strictEqual(pushed.inactiveCount, 1);
        assert.strictEqual(popValue, "done");
    });

    it("pop at the root throws", () => {
        const history = new InteractionStateHistory(fakeContext);
        assert.throws(() => history.pop());
    });

    it("clear pops every pushed state back down to the root", () => {
        const history = new InteractionStateHistory(fakeContext);
        const a = new SpyState();
        const b = new SpyState();
        history.push(a);
        history.push(b);

        // a was already deactivated once when b was pushed on top of it.
        assert.strictEqual(a.inactiveCount, 1);

        history.clear();

        assert.strictEqual(history.size, 1);
        // clear deactivates every state still on the stack above the root.
        assert.strictEqual(a.inactiveCount, 2);
        assert.strictEqual(b.inactiveCount, 1);
    });
});
