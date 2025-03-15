import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import * as url from "url";

interface ServerOptions {
    port: number;
    serveDirectory: string;
}

async function startServer(options: ServerOptions): Promise<void> {
    const { port, serveDirectory } = options;
    const resolvedServeDirectory = path.resolve(serveDirectory);

    const server = http.createServer(async (req, res) => {
        const now = new Date();
        const clientIp = req.socket.remoteAddress; // Best effort, consider X-Forwarded-For in real deployment behind a proxy.

        const logRequest = (statusCode: number) => {
            console.log(
                `${now.toISOString()} - ${clientIp} - ${req.method} ${req.url} - ${statusCode}`,
            );
        };

        try {
            if (req.method !== "GET") {
                res.writeHead(405, { "Content-Type": "text/plain" });
                res.end("Method Not Allowed");
                logRequest(405);
                return;
            }

            const parsedUrl = url.parse(req.url!, true); // Parse the URL
            let pathname = parsedUrl.pathname!;

            if (pathname === "/") {
                pathname = "/index.html"; // Default to index.html
            }

            const filePath = path.join(resolvedServeDirectory, pathname);
            const normalizedPath = path.normalize(filePath);

            // **Critical Security Check: Prevent Directory Traversal**
            if (!normalizedPath.startsWith(resolvedServeDirectory)) {
                res.writeHead(403, { "Content-Type": "text/plain" });
                res.end("Forbidden");
                logRequest(403);
                return;
            }

            // **Critical Security Check: Restrict Cross-Origin Requests (CORS)**

            // Only allow requests from the same origin (localhost)
            const origin = req.headers.origin;
            if (
                origin &&
                !origin.startsWith("http://localhost") &&
                !origin.startsWith(`http://127.0.0.1`)
            ) {
                // Allow both 127.0.0.1 and localhost
                res.writeHead(403, { "Content-Type": "text/plain" });
                res.end("Forbidden - Cross-Origin Request Blocked");
                logRequest(403);
                return;
            }

            try {
                const fileContent = await fs.readFile(normalizedPath);
                const extname = path.extname(normalizedPath).toLowerCase();
                let contentType = "application/octet-stream"; // Default

                switch (extname) {
                    case ".html":
                        contentType = "text/html";
                        break;
                    case ".css":
                        contentType = "text/css";
                        break;
                    case ".js":
                        contentType = "text/javascript";
                        break;
                    case ".png":
                        contentType = "image/png";
                        break;
                    case ".tff":
                        contentType = "font/tff";
                        break;
                }

                res.writeHead(200, {
                    "Content-Type": contentType,
                }); //spread in base headers
                res.end(fileContent);
                logRequest(200);
            } catch (error: any) {
                if (error.code === "ENOENT") {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not Found");
                    logRequest(404);
                } else {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end("Internal Server Error");
                    logRequest(500);
                }
            }
        } catch (error) {
            console.error("Unhandled error:", error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
            logRequest(500);
        }
    });

    server.listen(port, "127.0.0.1", () => {
        // Bind to localhost
        console.log(`Server running at http://127.0.0.1:${port}/`);
        console.log(`Serving files from: ${resolvedServeDirectory}`);
    });

    server.on("error", (error: Error) => {
        console.error("Server Error:", error);
    });
}

const options: ServerOptions = {
    port: 8080,
    serveDirectory: "./public", // Directory to serve files from.  Create a 'public' folder.
};

async function init() {
    try {
        await startServer(options);
    } catch (err) {
        console.error("Failed to init directory:", err);
    }
}

init();
