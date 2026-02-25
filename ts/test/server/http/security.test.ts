import assert from "node:assert";
import { describe, it } from "node:test";
import type { IncomingMessage } from "node:http";
import { checkOrigin } from "../../../src/server/http/security.ts";

function makeRequest(headers: Record<string, string>): IncomingMessage {
    return { headers } as unknown as IncomingMessage;
}

describe("checkOrigin", () => {
    it("returns true when Origin is absent", () => {
        const req = makeRequest({ host: "example.com" });
        assert.strictEqual(checkOrigin(req), true);
    });

    it("returns true when Origin host matches Host header", () => {
        const req = makeRequest({
            host: "example.com",
            origin: "https://example.com",
        });
        assert.strictEqual(checkOrigin(req), true);
    });

    it("returns true when Origin host matches Host including port", () => {
        const req = makeRequest({
            host: "example.com:8080",
            origin: "https://example.com:8080",
        });
        assert.strictEqual(checkOrigin(req), true);
    });

    it("returns false when Origin host differs from Host header", () => {
        const req = makeRequest({
            host: "example.com",
            origin: "https://evil.com",
        });
        assert.strictEqual(checkOrigin(req), false);
    });

    it("returns false when Origin is present but Host header is missing", () => {
        const req = makeRequest({ origin: "https://example.com" });
        assert.strictEqual(checkOrigin(req), false);
    });

    it("returns false when Origin is malformed and cannot be parsed", () => {
        const req = makeRequest({
            host: "example.com",
            origin: "not-a-valid-url",
        });
        assert.strictEqual(checkOrigin(req), false);
    });

    it("returns false when Origin port differs from Host port", () => {
        const req = makeRequest({
            host: "example.com:8080",
            origin: "https://example.com:9090",
        });
        assert.strictEqual(checkOrigin(req), false);
    });

    it("returns false when subdomain is present in Origin but not in Host", () => {
        const req = makeRequest({
            host: "example.com",
            origin: "https://sub.example.com",
        });
        assert.strictEqual(checkOrigin(req), false);
    });
});
