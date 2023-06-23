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
import Jimp from "jimp";
export class BitmapImage {
    async create() {
        const createPromise = new Promise((resolve, reject)=>{
            new Jimp(this.width, this.height, (err, image)=>{
                if (!!err) {
                    reject(err);
                } else {
                    resolve(image);
                }
            });
        });
        this.image = await createPromise;
    }
    setPixel(x, y, pixel) {
        const color = Jimp.rgbaToInt(pixel.red, pixel.green, pixel.blue, pixel.alpha);
        if (this.image) {
            this.image.setPixelColor(color, x, y);
        }
    }
    async write(filename) {
        if (this.image) {
            await this.image.writeAsync(filename);
        }
    }
    constructor(width, height){
        _define_property(this, "width", void 0);
        _define_property(this, "height", void 0);
        _define_property(this, "image", void 0);
        this.width = width;
        this.height = height;
    }
}
