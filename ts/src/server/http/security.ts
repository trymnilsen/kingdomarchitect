import type { IncomingMessage } from "node:http";

/**
 * Compares the Origin header against the Host header. Returns true if
 * they match (same-origin) or if Origin is absent (non-browser request).
 * Returns false if Origin is present but doesn't match Host.
 */
export function checkOrigin(req: IncomingMessage): boolean {
    const origin = req.headers.origin;
    if (!origin) {
        return true;
    }

    const host = req.headers.host;
    if (!host) {
        return false;
    }

    try {
        const originUrl = new URL(origin);
        return originUrl.host === host;
    } catch {
        return false;
    }
}
