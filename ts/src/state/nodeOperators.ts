import { JsonNode, JsonTree } from "./jsonNode";

function prop<T, K extends keyof T>(obj: T, key: K) {
    return obj[key];
}

type RootTestType = { id: number; text: string; due: Date; testType: TestType };
type TestType = {
    foo: number;
    bar: string;
};
const todo: RootTestType = {
    id: 1,
    text: "Buy milk",
    due: new Date(2016, 11, 31),
    testType: {
        foo: 3,
        bar: "hello"
    }
};

const id = prop(todo, "id"); // number
const text = prop(todo, "text"); // string
const due = prop(todo, "due"); // Date
const ok = prop(todo, "testType"); // Date

function createEntityFunction<T>(node: JsonNode) {
    return (key: keyof T) => {
        return createEntityFunction<T[keyof T]>(node);
    };
}

export interface NodeOperators<T> {
    entity?: (key: keyof T) => void;
}

export function rootNode<T>(node: JsonNode): NodeOperators<T> {
    return {
        entity: createEntityFunction<T>(node)
    };
}

const tree = new JsonTree();

const test2 = rootNode<RootTestType>(tree);
//const testTypeEntity =
