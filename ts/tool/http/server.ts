import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const serverName = "kingdom";

http.createServer(function (request, response) {
    console.log(request.method + " " + request.url);

    var filePath = "." + request.url;
    if (filePath == "./") filePath = "./index.html";
    filePath = path.join(process.cwd(), "public", filePath);
    var extname = path.extname(filePath);
    var contentType = "text/html";
    switch (extname) {
        case ".js":
            contentType = "text/javascript";
            break;
        case ".css":
            contentType = "text/css";
            break;
        case ".json":
            contentType = "application/json";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".jpg":
            contentType = "image/jpg";
            break;
        case ".wav":
            contentType = "audio/wav";
            break;
    }

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == "ENOENT") {
                response.writeHead(404, {
                    server: serverName,
                });
                response.end("404");
                response.end();
            } else {
                response.writeHead(500, {
                    server: serverName,
                });
                response.end("Internal server error");
                response.end();
            }

            console.error(error);
        } else {
            response.writeHead(200, {
                "Content-Type": contentType,
                server: serverName,
            });
            response.end(content, "utf-8");
        }
    });
}).listen(8080);

console.log("Server running at http://127.0.0.1:8080/ serving");
