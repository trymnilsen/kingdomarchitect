import { allSides } from "../common/sides.js";
import { AssetLoader } from "../module/asset/loader/assetLoader.js";
import { sprites2 } from "../module/asset/sprite.js";
import { ninePatchBackground } from "../module/ui/dsl/uiBackgroundDsl.js";
import { wrapUiSize, zeroSize } from "../module/ui/uiSize.js";
import { Camera } from "../rendering/camera.js";
import { Renderer } from "../rendering/renderer.js";
import { actionbarTextStyle } from "../rendering/text/textStyle.js";
import {
    createComponent,
    PlacedChild,
    UiRenderer,
    type ComponentDescriptor,
    type UISize,
} from "../module/ui/declarative/ui.js";
import { uiBox } from "../module/ui/declarative/uiBox.js";
import {
    CrossAxisAlignment,
    uiColumn,
} from "../module/ui/declarative/uiSequence.js";
import { uiText } from "../module/ui/declarative/uiText.js";
