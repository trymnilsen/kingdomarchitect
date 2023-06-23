import getPixels from "get-pixels";
export async function getPixelsAsync(path) {
    return new Promise((resolve, reject)=>{
        getPixels(path, (error, pixels)=>{
            if (!!error) {
                reject(error);
            } else {
                resolve(pixels);
            }
        });
    });
}
