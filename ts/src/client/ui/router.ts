import { View } from "./view";
import { ServiceContainer } from "../../common/ioc/service";
import { ViewContext } from "./viewContext";

interface Route {
    regex: RegExp;
    view: View;
}

export class NotFoundView extends View {
    public render(): HTMLElement {
        console.log("rendering not found");
        const container = document.createElement("div");
        container.innerText = "Not found";
        return container;
    }

    public dispose(): void {
        console.log("Disposing not found view");
    }
}

export class Router {
    private currentView: View;
    private currentElement: HTMLElement;
    private container: HTMLElement;
    private routes: Route[];
    private notFoundView: NotFoundView;
    private viewContext: ViewContext;

    public constructor(
        mountingPoint: string,
        routes: { [id: string]: View },
        services: ServiceContainer
    ) {
        this.container = document.querySelector(mountingPoint);
        document.addEventListener("click", this.documentClick);
        window.addEventListener("popstate", this.stackPopped);
        this.notFoundView = new NotFoundView();
        this.routes = this.createRoutes(routes);
        this.viewContext = { ioc: services };
    }

    public init() {
        this.routeView();
    }

    private documentClick = (event: MouseEvent) => {
        const targetElement = event.target as HTMLAnchorElement;
        if (!!targetElement && targetElement.tagName.toLowerCase() === "a") {
            console.log("clicked", event);
            event.preventDefault();
            event.stopImmediatePropagation();

            this.routeView(targetElement.pathname);
        }
    };

    private stackPopped = (event: PopStateEvent) => {
        console.log("Stack popped", event);
        this.routeView();
    };

    private routeView(url?: string) {
        if (!!url) {
            window.history.pushState({}, "", url);
        }
        if (!!this.currentView) {
            this.currentView.dispose();
            this.currentElement.remove();
        }
        const view: View = this.getView();
        this.currentView = view;
        console.log(`Rendering to ${view}`);
        const element = view.render();
        this.currentElement = element;
        this.container.append(element);
        console.log("Mounting view");
        view.onMounted(this.viewContext);
    }

    private getView(): View {
        console.log("Finding view for ", window.location.pathname);
        const route = this.routes.find(
            (x) => x.regex.exec(window.location.pathname) !== null
        );
        if (!!route) {
            console.log("Found");
            return route.view;
        } else {
            console.log("Not found");
            return this.notFoundView;
        }
    }

    private createRoutes(routes: { [id: string]: View }): Route[] {
        const finalRoutes: Route[] = [];
        for (const path in routes) {
            if (routes.hasOwnProperty(path)) {
                const view = routes[path];
                try {
                    const regex = new RegExp(path);
                    finalRoutes.push({ regex, view });
                } catch {
                    console.error(
                        "Could not create route for invalid regex",
                        path
                    );
                }
            }
        }
        if (finalRoutes.length === 0) {
            console.warn("No routes defined");
        }
        return finalRoutes;
    }
}
