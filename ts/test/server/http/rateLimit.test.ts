import assert from "node:assert";
import { describe, it } from "node:test";
import { createRateLimiter } from "../../../src/server/http/rateLimit.ts";

describe("createRateLimiter", () => {
    it("allows requests within the limit", () => {
        const limiter = createRateLimiter(60_000, 3);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), true);
    });

    it("blocks requests exceeding the limit", () => {
        const limiter = createRateLimiter(60_000, 2);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), false);
        assert.strictEqual(limiter.check("client-a"), false);
    });

    it("tracks keys independently", () => {
        const limiter = createRateLimiter(60_000, 1);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-b"), true);
        assert.strictEqual(limiter.check("client-a"), false);
        assert.strictEqual(limiter.check("client-b"), false);
    });

    it("resets all state", () => {
        const limiter = createRateLimiter(60_000, 1);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), false);
        limiter.reset();
        assert.strictEqual(limiter.check("client-a"), true);
    });

    it("allows requests after window expires", async () => {
        // Use a very short window for testing
        const limiter = createRateLimiter(50, 1);
        assert.strictEqual(limiter.check("client-a"), true);
        assert.strictEqual(limiter.check("client-a"), false);

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.strictEqual(limiter.check("client-a"), true);
    });
});
