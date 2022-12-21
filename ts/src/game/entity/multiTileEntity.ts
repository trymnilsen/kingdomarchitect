import { Entity } from "./entity";

export abstract class MultiTileEntity extends Entity {
    public get connectedTiles(): string[] | null {
        return null;
    }
    public get multiTileSource(): string | null {
        return null;
    }
}
