import { controller, get, post } from "./rest";
import { Request, Response } from "express";
import { UserStore } from "../store/userStore";

@controller("/user")
export class UserController {
    private name = "hello";

    private userStore: UserStore;

    public constructor(userStore: UserStore) {
        this.userStore = userStore;
    }
    @get("/")
    public show(req: Request, res: Response) {
        res.send("hello: " + this.name);
    }
    @post("/anonymous")
    public async createAnonymousUser(req: Request, res: Response) {
        const user = await this.userStore.createAnonymousUser();
        res.json(user);
    }
}
