import { controller, get, post } from "./rest";
import { Request, Response } from "express";
import { UserStore } from "../store/userStore";

@controller("/authenticate")
export class AuthenticateController {

    public constructor() {

    }
    @post("/websocket")
    public async createAnonymousUser(req: Request, res: Response) {

    }
}
