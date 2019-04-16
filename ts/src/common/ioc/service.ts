import { isBlank } from "../string";

export interface Service {
    readonly name: string;
}
export class ServiceContainer {
    public services: { [id: string]: Service };
    public constructor() {
        this.services = {};
    }
    public getService<T extends Service>(name: string): T {
        const service = this.services[name];
        if (!service) {
            console.log("Service not found: ", name);
        }
        return service as T;
    }
    public registerService(service: Service) {
        if (!service) {
            console.error("Cannot register undefined service");
        }
        if (isBlank(service.name)) {
            console.error("Service name empty, cannot register");
        }
        this.services[service.name] = service;
    }
}
