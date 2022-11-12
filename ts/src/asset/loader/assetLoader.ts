import { assets, ImageAsset } from "../assets";
import { Sprite } from "../sprite";

export class AssetLoader {
    private _assets: { [name: string]: HTMLImageElement } = {};

    async load(): Promise<void> {
        const loadables = Object.entries(assets);
        for (let i = 0; i < loadables.length; i++) {
            const asset = loadables[i];
            const imageElement = await this.loadAsset(asset[1]);
            this._assets[asset[0]] = imageElement;
        }
        await this.loadFonts();
    }

    getAsset(asset: ImageAsset): HTMLImageElement {
        return this._assets[asset];
    }

    /**
     * Returns a sprite that is backed by the given asset with its bounds
     * defined by the full width and height of the asset
     * @param asset
     */
    getAssetAsSprite(asset: ImageAsset): Sprite {
        const image = this.getAsset(asset);
        return {
            asset: asset,
            bounds: {
                x1: 0,
                y1: 0,
                x2: image.width,
                y2: image.height,
            },
        };
    }

    private async loadFonts(): Promise<void> {
        const myFont = new FontFace(
            "Silkscreen",
            "url(asset/silkscreen_regular.ttf)"
        );
        const loadedFont = await myFont.load();
        document.fonts.add(loadedFont);
    }

    private loadAsset(name: string): Promise<HTMLImageElement> {
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
