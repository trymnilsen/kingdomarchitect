import { describe, expect, test } from "vitest";
import { UiRenderer } from "../../src/module/ui/declarative/render.js";
import {
    createUiComponent,
    type ComponentDescriptor,
} from "../../src/module/ui/declarative/component.js";

type ChildrenProp = {
    children: ComponentDescriptor[];
};

type TextProp = {
    text: string;
};

const group = createUiComponent<ChildrenProp>(({ props }) => {
    return props.children;
});

const textBox = createUiComponent<TextProp>(({}) => {});

const emptyComponent = createUiComponent(() => {});

const root = createUiComponent(() => {
    return group({
        children: [
            textBox({
                text: "hello",
            }),
            textBox({
                text: "second hello",
            }),
            group({
                children: [
                    textBox({
                        text: "a nested hello",
                    }),
                    emptyComponent(),
                ],
            }),
        ],
    });
});

const launchedEffect1 = createUiComponent(() => {
    return group({
        children: [
            textBox({
                text: "hello",
            }),
            textBox({
                text: "second hello",
            }),
            group({
                children: [
                    textBox({
                        text: "a nested hello",
                    }),
                    launchedEffectView(),
                ],
            }),
        ],
    });
});

const launchedEffect2 = createUiComponent(() => {
    return group({
        children: [
            textBox({
                text: "hello",
            }),
            textBox({
                text: "second hello",
            }),
            group({
                children: [
                    textBox({
                        text: "a nested hello",
                    }),
                    emptyComponent(),
                ],
            }),
        ],
    });
});

const launchedEffectView = createUiComponent(({ withEffect: useEffect }) => {
    useEffect(() => {
        console.log("Launched effect");
        return () => {
            console.log("Disposed effect");
        };
    }, []);
    return textBox({
        text: "hello",
    });
});

describe("renderer", () => {
    /*
    test("generate descriptor tree", () => {
        const renderer = new UiRenderer();
        renderer.renderComponent(root());
        renderer.renderComponent(root());
        expect(5).toBe(5);
    });

    test("launchedEffect", () => {
        const renderer = new UiRenderer();
        renderer.renderComponent(launchedEffect1());
        renderer.renderComponent(launchedEffect1());
        renderer.renderComponent(launchedEffect2());
        renderer.renderComponent(launchedEffect1());
        expect(5).toBe(5);
    });*/
});
