import { bins } from "../../../generated/sprites.js";

export class AssetLoader {
    private _assets: Record<string, HTMLImageElement> = {};
    private _loaderPromise?: Promise<unknown>;

    public get loaderPromise(): Promise<unknown> | undefined {
        return this._loaderPromise;
    }

    load() {
        const loadPromises: Promise<unknown>[] = [];

        loadPromises.push(this.loadFonts());
        for (const bin of bins) {
            loadPromises.push(this.loadAsset(bin.name, bin.filename));
        }

        this._loaderPromise = Promise.all(loadPromises);
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
        const domImage = document.getElementById(`bin-${name}`);
        if (domImage && domImage instanceof HTMLImageElement) {
            console.log(`Image ${name} existed as dom image waiting for load`);
            if (!domImage.complete) {
                await this.promisifyExistingImage(domImage);
            }
            this._assets[name] = domImage;
        } else {
            console.log(`Image ${name} was not found in dom, creating`);
            const imageElement = await this.fetchAsset(filename);
            this._assets[name] = imageElement;
        }
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

    private promisifyExistingImage(
        image: HTMLImageElement,
    ): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            image.addEventListener("load", () => {
                console.log("Image loaded");
                resolve(image);
            });
            image.addEventListener("error", () => {
                console.log("Error loading image");
                reject();
            });
        });
    }
}
