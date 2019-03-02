import { controller, get, post } from "../rest";
import { Request, Response } from "express";

@controller("/user")
export class UserController {
    private name = "hello";
    public constructor() {

    }
    @get("/")
    public show(req: Request, res: Response) {
        res.send("hello: " + this.name);
    }
    @post("/")
    public create(req: Request, res: Response) {

    }
}
