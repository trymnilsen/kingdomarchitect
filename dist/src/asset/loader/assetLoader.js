function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import * as binsJson from "../../../generated/bins.json.js";
export class AssetLoader {
    async load() {
        const loadPromises = [];
        loadPromises.push(this.loadFonts());
        for (const bin of Object.entries(binsJson)){
            if (bin[0] != "default") {
                loadPromises.push(this.loadAsset(bin[0], bin[1]));
            }
        }
        await Promise.all(loadPromises);
    }
    getBinAsset(binName) {
        const binAsset = this._assets[binName];
        if (!binAsset) {
            throw new Error(`Cannot find bin asset: ${binName}`);
        }
        return binAsset;
    }
    async loadFonts() {
        const myFont = new FontFace("Silkscreen", "url(asset/silkscreen_regular.ttf)");
        const loadedFont = await myFont.load();
        document.fonts.add(loadedFont);
    }
    async loadAsset(name, filename) {
        const imageElement = await this.fetchAsset(filename);
        this._assets[name] = imageElement;
    }
    fetchAsset(name) {
        return new Promise((resolve, reject)=>{
            const element = new Image();
            element.addEventListener("load", ()=>{
                resolve(element);
            });
            element.addEventListener("error", ()=>{
                reject();
            });
            element.src = "asset/" + name;
        });
    }
    constructor(){
        _define_property(this, "_assets", {});
    }
}
