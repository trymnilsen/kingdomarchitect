import assert from "node:assert";
import { describe, it } from "node:test";
import { Readable } from "node:stream";
import {
    parseJsonBody,
    BodyTooLargeError,
    InvalidJsonError,
} from "../../../src/server/http/bodyParser.ts";
import type { IncomingMessage } from "node:http";

function createMockRequest(body: string): IncomingMessage {
    const readable = new Readable({
        read() {
            this.push(Buffer.from(body));
            this.push(null);
        },
    });
    return readable as unknown as IncomingMessage;
}

function createChunkedMockRequest(chunks: string[]): IncomingMessage {
    let index = 0;
    const readable = new Readable({
        read() {
            if (index < chunks.length) {
                this.push(Buffer.from(chunks[index]));
                index++;
            } else {
                this.push(null);
            }
        },
    });
    return readable as unknown as IncomingMessage;
}

describe("parseJsonBody", () => {
    it("parses valid JSON", async () => {
        const req = createMockRequest('{"name": "test", "value": 42}');
        const result = await parseJsonBody<{ name: string; value: number }>(
            req,
            1024,
        );
        assert.deepStrictEqual(result, { name: "test", value: 42 });
    });

    it("rejects body exceeding size limit", async () => {
        const largeBody = JSON.stringify({ data: "x".repeat(200) });
        const req = createMockRequest(largeBody);
        await assert.rejects(
            () => parseJsonBody(req, 50),
            (err: Error) => err instanceof BodyTooLargeError,
        );
    });

    it("rejects invalid JSON", async () => {
        const req = createMockRequest("not valid json {{{");
        await assert.rejects(
            () => parseJsonBody(req, 1024),
            (err: Error) => err instanceof InvalidJsonError,
        );
    });

    it("handles empty body as invalid JSON", async () => {
        const req = createMockRequest("");
        await assert.rejects(
            () => parseJsonBody(req, 1024),
            (err: Error) => err instanceof InvalidJsonError,
        );
    });

    it("handles chunked requests", async () => {
        const req = createChunkedMockRequest(['{"ke', 'y": "va', 'lue"}']);
        const result = await parseJsonBody<{ key: string }>(req, 1024);
        assert.deepStrictEqual(result, { key: "value" });
    });
});
