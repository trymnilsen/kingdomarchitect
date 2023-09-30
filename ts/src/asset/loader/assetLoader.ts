import { bins } from "../../../generated/sprites.js";

export class AssetLoader {
    private _assets: Record<string, HTMLImageElement> = {};

    async load(): Promise<void> {
        const loadPromises: Promise<unknown>[] = [];

        loadPromises.push(this.loadFonts());

        for (const bin of bins) {
            loadPromises.push(this.loadAsset(bin.name, bin.filename));
        }

        await Promise.all(loadPromises);
    }

    getBinAsset(binName: string): HTMLImageElement {
        const binAsset = this._assets[binName];
        if (!binAsset) {
            throw new Error(`Cannot find bin asset: ${binName}`);
        }

        return binAsset;
    }

    private async loadFonts(): Promise<void> {
        const myFont = new FontFace(
            "Silkscreen",
            "url(asset/silkscreen_regular.ttf)",
        );
        const loadedFont = await myFont.load();
        document.fonts.add(loadedFont);
    }

    private async loadAsset(name: string, filename: string) {
        const imageElement = await this.fetchAsset(filename);
        this._assets[name] = imageElement;
    }

    private fetchAsset(name: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const element = new Image();
            element.addEventListener("load", () => {
                resolve(element);
            });
            element.addEventListener("error", () => {
                reject();
            });
            element.src = "asset/" + name;
        });
    }
}
