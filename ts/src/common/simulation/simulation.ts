import { SimulationState } from "./simulationState";

export interface SimulationEvent {
    source: string;
}
export class Simulation {
    public constructor(simulationState: SimulationState) {}
    public dispatchEvent(event: SimulationEvent) {}
}
