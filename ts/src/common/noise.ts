import { lerp } from "./number.ts";

/**
 * Coherent 2D value noise in [0, 1). Unlike white noise, nearby coordinates
 * return similar values, so thresholding or weighting by it produces smooth,
 * organic boundaries rather than speckle. Deterministic for a given seed.
 *
 * How: the plane is a grid of integer lattice points, each assigned a stable
 * pseudo-random value by hashing its coordinates with the seed. A sample reads
 * the four corners of the cell it falls in and interpolates between them, easing
 * the fractional position with a smoothstep curve so cell edges are not visible.
 */
export function valueNoise2d(x: number, y: number, seed: number): number {
    const xFloor = Math.floor(x);
    const yFloor = Math.floor(y);
    const xFraction = x - xFloor;
    const yFraction = y - yFloor;

    const topLeft = latticeValue(xFloor, yFloor, seed);
    const topRight = latticeValue(xFloor + 1, yFloor, seed);
    const bottomLeft = latticeValue(xFloor, yFloor + 1, seed);
    const bottomRight = latticeValue(xFloor + 1, yFloor + 1, seed);

    const xEase = smoothstep(xFraction);
    const yEase = smoothstep(yFraction);

    const top = lerp(topLeft, topRight, xEase);
    const bottom = lerp(bottomLeft, bottomRight, xEase);
    return lerp(top, bottom, yEase);
}

/**
 * Fractal (fractional Brownian motion) noise: sums several octaves of value
 * noise at doubling frequency and shrinking amplitude, giving detail at multiple
 * scales. Returns a value in [0, 1).
 *
 * @param octaves how many layers to sum
 * @param persistence how quickly amplitude falls off per octave (0..1)
 */
export function fbmNoise2d(
    x: number,
    y: number,
    seed: number,
    octaves: number,
    persistence: number,
): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let octave = 0; octave < octaves; octave++) {
        total +=
            valueNoise2d(x * frequency, y * frequency, seed + octave) *
            amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= 2;
    }

    if (maxAmplitude === 0) {
        return 0;
    }
    // Divide by the summed amplitude so the result stays in [0, 1) no matter how
    // many octaves were added.
    return total / maxAmplitude;
}

/**
 * Stable pseudo-random value in [0, 1) for an integer lattice point, mixed from
 * its coordinates and the seed in the spirit of hash.ts.
 */
function latticeValue(x: number, y: number, seed: number): number {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
    h = Math.imul(h ^ seed ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    // `>>> 0` reads the mix as an unsigned 32-bit int; / 2^32 maps to [0, 1).
    return ((h ^ (h >>> 16)) >>> 0) / 0x1_0000_0000;
}

/** Smoothstep easing (3t^2 - 2t^3): zero slope at both ends. */
function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
}
