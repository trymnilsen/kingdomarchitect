import { invert } from "../../common/point.js";
import {
    EcsInputEvent,
    EcsInputPanData,
    EcsRenderEvent,
} from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { Camera } from "../../rendering/camera.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { InteractionHandler } from "../interaction/handler/interactionHandler.js";

export function createUiSystem(
    interactionHandler: InteractionHandler,
    camera: Camera,
): EcsSystem {
    return createSystem({})
        .onEvent(EcsInputEvent, (_query, event, _world) => {
            handleInput(interactionHandler, camera, event);
        })
        .onEvent(EcsRenderEvent, (_query, event, _world) => {
            renderUI(interactionHandler, event.renderScope);
        })
        .build();
}

function renderUI(
    interactionHandler: InteractionHandler,
    renderScope: RenderScope,
) {
    interactionHandler.onDraw(renderScope);
}

function handleInput(
    interactionHandler: InteractionHandler,
    camera: Camera,
    event: EcsInputEvent,
) {
    switch (event.data.id) {
        case "action":
            interactionHandler.onInput(event.data.action);
            break;
        case "pan":
            handlePan(interactionHandler, camera, event.data);
            break;
        case "tap-down":
            break;
        case "tap-end":
            break;
    }
}

function handlePan(
    interactionHandler: InteractionHandler,
    camera: Camera,
    panAction: EcsInputPanData,
) {
    if (panAction.downTapHandled) {
        interactionHandler.onTapPan(
            panAction.movement,
            panAction.position,
            panAction.startPosition,
        );
    } else {
        camera.translate(invert(panAction.movement));
    }
}
