import type { IncomingMessage, ServerResponse } from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".wasm": "application/wasm",
    ".map": "application/json",
};

/**
 * Serves a static file from the given directory.
 * Returns true if the request was handled, false otherwise.
 * Only handles GET requests. Rejects dotfile path segments and
 * directory traversal attempts.
 */
export async function serveStaticFile(
    req: IncomingMessage,
    res: ServerResponse,
    serveDirectory: string,
): Promise<boolean> {
    if (req.method !== "GET") {
        return false;
    }

    const resolvedServeDirectory = path.resolve(serveDirectory);
    let pathname: string;
    try {
        const parsed = new URL(req.url!, `http://${req.headers.host}`);
        pathname = decodeURIComponent(parsed.pathname);
    } catch {
        return false;
    }

    if (pathname === "/") {
        pathname = "/index.html";
    }

    // Reject paths containing dotfile segments
    const segments = pathname.split("/");
    for (const segment of segments) {
        if (segment.startsWith(".") && segment.length > 1) {
            return false;
        }
    }

    const filePath = path.join(resolvedServeDirectory, pathname);
    const normalizedPath = path.normalize(filePath);

    // Prevent directory traversal
    if (!normalizedPath.startsWith(resolvedServeDirectory)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return true;
    }

    try {
        const fileContent = await fs.readFile(normalizedPath);
        const extname = path.extname(normalizedPath).toLowerCase();
        const contentType =
            contentTypes[extname] || "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": fileContent.length,
        });
        res.end(fileContent);
        return true;
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "code" in error &&
            (error as NodeJS.ErrnoException).code === "ENOENT"
        ) {
            return false;
        }
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return true;
    }
}
