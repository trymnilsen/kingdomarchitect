import {
    ConstructorFunction,
    getConstructorName,
} from "../../common/constructor.js";
import { EntityComponent } from "./entityComponent.js";

export class ComponentQueryCache {
    private entries: Map<
        ConstructorFunction<EntityComponent>,
        EntityComponent[]
    > = new Map();

    setComponents<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
        components: TFilter[],
    ) {
        this.entries.set(filterType, components);
    }

    getComponents<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter[] | null {
        const component = this.entries.get(filterType) as TFilter[];
        return component || null;
    }

    clearAll() {
        this.entries.clear();
    }

    clearEntry<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ) {
        this.entries.delete(filterType);
    }
}
