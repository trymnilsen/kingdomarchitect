import { defaultTextStyle } from "../rendering/text/textStyle.js";
import { createUiComponent } from "./component.js";
import { uiBox } from "./uiBox.js";
import { uiText } from "./uiText.js";

export const uiButton = createUiComponent(({ withGesture: useGesture }) => {
    useGesture((_event) => {
        return true;
    });

    return uiBox({
        padding: 8,
        color: "blue",
        child: uiText({
            content: "Click me",
            textStyle: defaultTextStyle,
        }),
    });
});
