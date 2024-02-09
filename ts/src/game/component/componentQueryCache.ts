import {
    ConstructorFunction,
    getConstructorName,
} from "../../common/constructor.js";
import { EntityComponent } from "./entityComponent.js";

export class ComponentQueryCache {
    private entries: { [id: string]: EntityComponent[] } = {};

    setComponents<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
        components: TFilter[],
    ) {
        const componentId = filterType.name;
        this.entries[componentId] = components;
    }

    getComponents<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter[] | null {
        const componentId = filterType.name;
        const component = this.entries[componentId] as TFilter[];
        return component || null;
    }

    clearAll() {
        this.entries = {};
    }

    clearEntry<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ) {
        if (!!filterType && typeof filterType.name == "string") {
            delete this.entries[filterType.name];
        }
    }
}
