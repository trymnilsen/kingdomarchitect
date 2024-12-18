import { invert } from "../../common/point.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { RootEntity } from "../../ecs/ecsWorldScope.js";
import {
    EcsInputEvent,
    EcsInputPanData,
} from "../../ecs/event/ecsInputEvent.js";
import { EcsRenderEvent } from "../../ecs/event/ecsRenderEvent.js";
import { Camera } from "../../rendering/camera.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { ChunkMapComponent } from "../ecsComponent/world/chunkmapComponent.js";
import { InteractionHandler } from "../interaction/handler/interactionHandler.js";

export function createUiSystem(
    interactionHandler: InteractionHandler,
    camera: Camera,
): EcsSystem {
    return createSystem()
        .onEvent(EcsInputEvent, (_query, event) => {
            handleInput(interactionHandler, camera, event);
        })
        .onEvent(EcsRenderEvent, (_query, event) => {
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
            const tapHandled = interactionHandler.onTapDown(
                event.data.position,
            );
            if (tapHandled) {
                event.markHandled();
            }
            break;
        case "tap-end":
            interactionHandler.onTapUp(event.data);
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
