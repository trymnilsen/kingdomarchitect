import type { IncomingMessage } from "node:http";

/**
 * Reads the full body of an HTTP request and parses it as JSON.
 * Rejects if the body exceeds maxBytes or is not valid JSON.
 */
export function parseJsonBody<T>(
    req: IncomingMessage,
    maxBytes: number,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        let settled = false;

        req.on("data", (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > maxBytes) {
                settled = true;
                req.destroy();
                reject(new BodyTooLargeError(maxBytes));
                return;
            }
            chunks.push(chunk);
        });

        req.on("error", (err) => {
            if (!settled) {
                settled = true;
                reject(err);
            }
        });

        req.on("end", () => {
            if (settled) {
                return;
            }
            settled = true;
            const body = Buffer.concat(chunks).toString("utf-8");
            try {
                resolve(JSON.parse(body) as T);
            } catch {
                reject(new InvalidJsonError());
            }
        });
    });
}

export class BodyTooLargeError extends Error {
    constructor(maxBytes: number) {
        super(`Request body exceeds ${maxBytes} bytes`);
        this.name = "BodyTooLargeError";
    }
}

export class InvalidJsonError extends Error {
    constructor() {
        super("Request body is not valid JSON");
        this.name = "InvalidJsonError";
    }
}
