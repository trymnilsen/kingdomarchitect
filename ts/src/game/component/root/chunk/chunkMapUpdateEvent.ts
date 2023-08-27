import { Point } from "../../../../common/point.js";
import { ComponentEvent } from "../../componentEvent.js";
import { ChunkMapComponent } from "./chunkMapComponent.js";

export class ChunkMapUpdateEvent extends ComponentEvent<ChunkMapComponent> {
    constructor(
        public readonly pointUpdated: Point,
        sourceComponent: ChunkMapComponent
    ) {
        super(sourceComponent);
    }
}
