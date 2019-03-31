import { Request, Response } from "express";
import { post, controller, get } from "./rest";

@controller("/world")
export class WorldController {
    @get("/")
    public getWorld(req: Request, res: Response) {

    }
    @post("/")
    public createWorld(req: Request, res: Response) {

    }
}
