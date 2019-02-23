import * as express from "express";

export function bootstrap() {
    const expressApp = express();
    expressApp.use(express.static("public"));
    expressApp.listen(5000, () => {
        console.log("Listening on port 5000");
    });
    const foo = "hello";
}
