import { defaultTextStyle } from "../../../rendering/text/textStyle.js";
import { createUiComponent } from "./component.js";
import { uiBox } from "./uiBox.js";
import { uiText } from "./uiText.js";

export const uiButton = createUiComponent(({ withGesture: useGesture }) => {
    useGesture((event) => {
        console.log("Button tapped");
        return true;
    });

    return uiBox({
        padding: 8,
        color: "green",
        child: uiText({
            content: "Click me",
            textStyle: defaultTextStyle,
        }),
    });
});
