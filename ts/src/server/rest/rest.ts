import { inspect } from "util";
import { Application } from "express";
import { UserController } from "./controller/user-controller";

enum Method {
    GET = "GET",
    POST = "POST",
    DELETE = "DELETE",
    PUT = "PUT"
}
interface ControllerMetadata {
    controllerPath?: string;
    controllerFunction: any;
    routes?: Route[];
}

interface Route {
    path: string;
    handler: Function;
    method: Method;
}

interface ControllerInstance {
    controllerFunction: Function;
    instance: Object;
}

const controllerMetadata: ControllerMetadata[] = [];
const controllerInstance: ControllerInstance[] = [];

function addControllerMetadataFromControllerDecorator(
    path: string,
    target: any
) {
    let metadata = controllerMetadata.find(
        (x) => x.controllerFunction === target
    );
    if (!metadata) {
        controllerMetadata.push({
            controllerFunction: target,
            controllerPath: path,
            routes: []
        });
    } else {
        metadata.controllerPath = path;
    }
}
function addControllerMetadataFromRequestMethodDecorator(
    path: string,
    owner: any,
    descriptor: PropertyDescriptor,
    method: Method
) {
    let metadata = controllerMetadata.find(
        (x) => x.controllerFunction === owner
    );
    if (!metadata) {
        metadata = {
            controllerFunction: owner,
            routes: []
        };
        controllerMetadata.push(metadata);
    }
    metadata.routes.push({
        path,
        method,
        handler: descriptor.value
    });
}

export function controller(path: string) {
    return function(target: any) {
        addControllerMetadataFromControllerDecorator(path, target);
    };
}

export function get(path?: string) {
    return function(
        target: Object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        addControllerMetadataFromRequestMethodDecorator(
            path,
            target.constructor,
            descriptor,
            Method.GET
        );
    };
}
export function post(path?: string) {
    return function(
        target: Object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        addControllerMetadataFromRequestMethodDecorator(
            path,
            target.constructor,
            descriptor,
            Method.POST
        );
    };
}

export function attachController(
    controllers: Object[],
    express: Application
) {
    controllers.forEach((controller) => {
        attachSingleController(controller, express);
    });
}

function attachSingleController(controller: Object, express: Application) {
    const metadata = controllerMetadata.find((x) => x.controllerFunction === controller.constructor);
    if (!metadata) {
        console.log("No controller metadata found for ", controller.constructor);
    }
    if (!!metadata.routes) {
        metadata.routes.forEach((r) => {
            const handler = r.handler.bind(controller);
            const path = metadata.controllerPath + r.path;
            console.log(`Creating route ${r.method} ${path}`);
            switch (r.method) {
                case Method.GET:
                    express.get(path, handler);
                    break;
                case Method.POST:
                    express.post(path, handler);
                    break;
                default:
                    console.log(r.method + " not yet supported");
                    break;
            }
        });
    }
}
