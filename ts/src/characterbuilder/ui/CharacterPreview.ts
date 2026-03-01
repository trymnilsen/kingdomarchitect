import { createComponent, sized } from "../../ui/declarative/ui.ts";
import {
    buildSpriteSheet,
    SpriteDefinitionCache,
} from "../characterSpriteGenerator.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import type { CharacterColors } from "../colors.ts";
import { CHARACTER_SPRITE, LAYOUT, type PreviewMode } from "./characterBuilderConstants.ts";
import { characterPartFrames } from "../../../generated/characterFrames.ts";
import { getAllAnimations } from "../animation/getAllAnimations.ts";
import type { CharacterAnimation } from "../characterAnimation.ts";
import { createPrimaryButton } from "./CharacterBuilderButtons.ts";
import { uiBox } from "../../ui/declarative/uiBox.ts";
import { uiColumn, uiRow } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { fillUiSize, wrapUiSize } from "../../ui/uiSize.ts";
import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";

export type CharacterPreviewProps = {
    colors: CharacterColors;
    previewMode: PreviewMode;
    selectedAnimation: string;
    currentFrame?: number;
};

const FRAME_WIDTH = CHARACTER_SPRITE.FRAME_WIDTH;
const FRAME_HEIGHT = CHARACTER_SPRITE.FRAME_HEIGHT;

type ZoomLevel = 1 | 2 | 4 | 8;

const allAnimations = getAllAnimations(
    characterPartFrames as unknown as CharacterAnimation[],
);
const maxFrames = allAnimations.reduce(
    (max, a) => Math.max(max, a.parts[0]?.frames.length ?? 0),
    0,
);
const animCount = allAnimations.length;
const sheetPixelW = maxFrames * FRAME_WIDTH;
const sheetPixelH = animCount * FRAME_HEIGHT;

type SheetViewportProps = {
    colors: CharacterColors;
    zoom: ZoomLevel;
    panX: number;
    panY: number;
};

const SheetViewport = createComponent<SheetViewportProps>(
    ({ props, withDraw, constraints }) => {
        const displayWidth = constraints.width;
        const displayHeight =
            sheetPixelW > 0
                ? Math.max(
                      1,
                      Math.round((displayWidth * sheetPixelH) / sheetPixelW),
                  )
                : 1;

        withDraw((scope, region) => {
            const spriteCache = new SpriteDefinitionCache();
            const generatedSprites = buildSpriteSheet(
                (w, h) => scope.getOffscreenRenderScope(w, h),
                props.colors,
                scope.assetLoader,
                spriteCache,
                allAnimations,
            );

            if (generatedSprites.length === 0) return;

            const viewportW = sheetPixelW / props.zoom;
            const viewportH = sheetPixelH / props.zoom;

            const sheetSpriteRef = {
                bin: generatedSprites[0].sprite.bin,
                spriteId: "sheet_viewport",
            };
            spriteRegistry.registerSprite(sheetSpriteRef, [
                viewportW,
                viewportH,
                props.panX,
                props.panY,
            ]);

            scope.drawScreenSpaceSprite({
                x: region.x,
                y: region.y,
                targetWidth: displayWidth,
                targetHeight: displayHeight,
                sprite: sheetSpriteRef,
                frame: 0,
            });
        });

        return sized(displayWidth, displayHeight);
    },
);

type SingleFrameViewportProps = {
    colors: CharacterColors;
    selectedAnimation: string;
    currentFrame: number;
};

const SingleFrameViewport = createComponent<SingleFrameViewportProps>(
    ({ props, withDraw, constraints }) => {
        const maxWidth =
            Math.floor(constraints.width / LAYOUT.SPRITE_GRID_SIZE) *
            LAYOUT.SPRITE_GRID_SIZE;
        const maxHeight =
            Math.floor(constraints.height / LAYOUT.SPRITE_GRID_SIZE) *
            LAYOUT.SPRITE_GRID_SIZE;
        const size = Math.min(maxWidth, maxHeight);

        withDraw((scope, region) => {
            const spriteCache = new SpriteDefinitionCache();
            const generatedSprites = buildSpriteSheet(
                (w, h) => scope.getOffscreenRenderScope(w, h),
                props.colors,
                scope.assetLoader,
                spriteCache,
                allAnimations,
            );

            const selectedSprite =
                generatedSprites.find(
                    (s) => s.animationName === props.selectedAnimation,
                )?.sprite || generatedSprites[0]?.sprite;

            if (!selectedSprite) return;

            scope.drawScreenSpaceSprite({
                x: region.x,
                y: region.y,
                targetWidth: size,
                targetHeight: size,
                sprite: selectedSprite,
                frame: props.currentFrame,
            });
        });

        return sized(size, size);
    },
);

/**
 * Character preview component that renders the sprite with selected colors
 * and animation. Supports both single frame and sprite sheet preview modes.
 * In sheet mode, zoom (1x–8x) and pan controls are shown below the preview.
 */
export const CharacterPreview = createComponent<CharacterPreviewProps>(
    ({ props, withState }) => {
        const [zoom, setZoom] = withState<ZoomLevel>(1);
        const [panX, setPanX] = withState(0);
        const [panY, setPanY] = withState(0);

        if (props.previewMode === "Single") {
            return SingleFrameViewport({
                colors: props.colors,
                selectedAnimation: props.selectedAnimation,
                currentFrame: props.currentFrame ?? 0,
            });
        }

        const viewportW = sheetPixelW / zoom;
        const viewportH = sheetPixelH / zoom;
        const maxPanX = Math.max(0, sheetPixelW - viewportW);
        const maxPanY = Math.max(0, sheetPixelH - viewportH);

        const canZoomIn = zoom < 8;
        const canZoomOut = zoom > 1;
        const canPanLeft = zoom > 1 && panX > 0;
        const canPanRight = zoom > 1 && panX < maxPanX;
        const canPanUp = zoom > 1 && panY > 0;
        const canPanDown = zoom > 1 && panY < maxPanY;

        const handlePanLeft = () => setPanX(Math.max(0, panX - FRAME_WIDTH));
        const handlePanRight = () =>
            setPanX(Math.min(maxPanX, panX + FRAME_WIDTH));
        const handlePanUp = () => setPanY(Math.max(0, panY - FRAME_HEIGHT));
        const handlePanDown = () =>
            setPanY(Math.min(maxPanY, panY + FRAME_HEIGHT));

        const handleZoomIn = () => {
            if (!canZoomIn) return;
            const newZoom = (zoom * 2) as ZoomLevel;
            const newViewportW = sheetPixelW / newZoom;
            const newViewportH = sheetPixelH / newZoom;
            const centerX = panX + viewportW / 2;
            const centerY = panY + viewportH / 2;
            setZoom(newZoom);
            setPanX(
                Math.max(
                    0,
                    Math.min(
                        sheetPixelW - newViewportW,
                        centerX - newViewportW / 2,
                    ),
                ),
            );
            setPanY(
                Math.max(
                    0,
                    Math.min(
                        sheetPixelH - newViewportH,
                        centerY - newViewportH / 2,
                    ),
                ),
            );
        };

        const handleZoomOut = () => {
            if (!canZoomOut) return;
            const newZoom = (zoom / 2) as ZoomLevel;
            const newViewportW = sheetPixelW / newZoom;
            const newViewportH = sheetPixelH / newZoom;
            setZoom(newZoom);
            setPanX(Math.min(panX, Math.max(0, sheetPixelW - newViewportW)));
            setPanY(Math.min(panY, Math.max(0, sheetPixelH - newViewportH)));
        };

        return uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            children: [
                uiBox({
                    width: fillUiSize,
                    height: fillUiSize,
                    child: SheetViewport({
                        colors: props.colors,
                        zoom,
                        panX,
                        panY,
                    }),
                }),
                uiRow({
                    width: fillUiSize,
                    children: [
                        createPrimaryButton(
                            "←",
                            handlePanLeft,
                            false,
                            !canPanLeft,
                        ),
                        createPrimaryButton(
                            "↑",
                            handlePanUp,
                            false,
                            !canPanUp,
                        ),
                        createPrimaryButton(
                            "↓",
                            handlePanDown,
                            false,
                            !canPanDown,
                        ),
                        createPrimaryButton(
                            "→",
                            handlePanRight,
                            false,
                            !canPanRight,
                        ),
                        createPrimaryButton(
                            "-",
                            handleZoomOut,
                            false,
                            !canZoomOut,
                        ),
                        uiBox({
                            width: fillUiSize,
                            height: wrapUiSize,
                            child: uiText({
                                content: `${zoom}x`,
                                textStyle: subTitleTextStyle,
                            }),
                        }),
                        createPrimaryButton(
                            "+",
                            handleZoomIn,
                            false,
                            !canZoomIn,
                        ),
                    ],
                }),
            ],
        });
    },
);
