import { TestNameSpace } from "./testClass";

export class BaseEvent {
    private _name: string;
    private testClass: TestNameSpace.TestClassFoo | null = null;
    public get name(): string {
        return this._name;
    }

    constructor(name: string) {
        this._name = name;
    }
}
