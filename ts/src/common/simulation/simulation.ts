
export interface SimulationEvent {
    source: string;
}
export class Simulation {
    public constructor() { }
    public dispatchEvent(event: SimulationEvent) { }
}
