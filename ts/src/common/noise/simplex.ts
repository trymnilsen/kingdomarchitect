/*
MIT License

Copyright (c) 2018 Jonas Wagner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * A function returning a pseudo-random floating-point number in the interval [0, 1)
 */
export type PRNG = () => number;

/**
 * A simplex noise generator
 */
export interface SimplexNoise {
    noise2D: (x: number, y: number) => number;
    noise3D: (x: number, y: number, z: number) => number;
    noise4D: (x: number, y: number, z: number, w: number) => number;
}

/**
 * Initialize a new simplex noise generator using the provided PRNG
 *
 * @param random a PRNG function like `Math.random` or `AleaPRNG.random`
 * @returns an initialized simplex noise generator
 */
export const mkSimplexNoise = (random: PRNG): SimplexNoise => {
    const tables = buildPermutationTables(random);
    return {
        noise2D: (x, y) => noise2D(tables, x, y),
        noise3D: (x, y, z) => noise3D(tables, x, y, z),
        noise4D: (x, y, z, w) => noise4D(tables, x, y, z, w),
    };
};

// 2D simplex noise
/** @internal */
const noise2D = (tables: PermTables, x: number, y: number): number => {
    const { perm, permMod12 } = tables;
    // Noise contributions from the three corners
    let n0 = 0.0,
        n1 = 0.0,
        n2 = 0.0;
    // Skew the input space to determine which simplex cell we're in
    var s = (x + y) * F2; // Hairy factor for 2D
    var i = Math.floor(x + s);
    var j = Math.floor(y + s);
    var t = (i + j) * G2;
    // Unskew the cell origin back to (x, y) space
    const x00 = i - t;
    const y00 = j - t;
    // The x, y distances from the cell origin
    const x0 = x - x00;
    const y0 = y - y00;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    // Offsets for second (middle) corner of simplex in (i, j) coords
    // lower triangle, XY order (0, 0) -> (1, 0) -> (1, 1) - or upper triangle, YX order (0, 0) -> (0, 1) -> (1, 1)
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    // A step of (1, 0) in (i, j) means a step of (1-c,  -c) in (x, y), and
    // a step of (0, 1) in (i, j) means a step of ( -c, 1-c) in (x, y), where
    // c = (3 - sqrt(3)) / 6
    // Offsets for middle corner in (x, y) unskewed coords
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    // Offsets for last corner in (x, y) unskewed coords
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
        const gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        // (x, y) of GRAD3 used for 2D gradient
        n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
        const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
        const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1, 1].
    return 70.0 * (n0 + n1 + n2);
};

// 3D simplex noise
/** @internal */
const noise3D = (
    tables: PermTables,
    x: number,
    y: number,
    z: number
): number => {
    const { perm, permMod12 } = tables;
    // Noise contributions from the four corners
    let n0 = 0.0,
        n1 = 0.0,
        n2 = 0.0,
        n3 = 0.0;
    // Skew the input space to determine which simplex cell we're in
    // Very nice and simple skew factor for 3D
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    // Unskew the cell origin back to (x, y, z) space
    const x00 = i - t;
    const y00 = j - t;
    const z00 = k - t;
    // The x, y, z distances from the cell origin
    const x0 = x - x00;
    const y0 = y - y00;
    const z0 = z - z00;
    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    // Offsets for second corner of simplex in (i, j, k) coords
    let i1, j1, k1;
    // Offsets for third corner of simplex in (i, j, k) coords
    let i2, j2, k2;
    if (x0 >= y0) {
        if (y0 >= z0) {
            // X Y Z order
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } else if (x0 >= z0) {
            // X Z Y order
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } else {
            // Z X Y order
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
    } else {
        // x0 < y0
        if (y0 < z0) {
            // Z Y X order
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } else if (x0 < z0) {
            // Y Z X order
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } else {
            // Y X Z order
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
    }
    // A step of (1, 0, 0) in (i, j, k) means a step of (1-c,  -c,  -c) in (x, y, z),
    // a step of (0, 1, 0) in (i, j, k) means a step of ( -c, 1-c,  -c) in (x, y, z), and
    // a step of (0, 0, 1) in (i, j, k) means a step of ( -c,  -c, 1-c) in (x, y, z), where
    // c = 1 / 6.
    // Offsets for second corner in (x, y, z) coords
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    // Offsets for third corner in (x, y, z) coords
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    // Offsets for last corner in (x, y, z) coords
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
        const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 =
            t0 *
            t0 *
            (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0 + GRAD3[gi0 + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
        const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 =
            t1 *
            t1 *
            (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1 + GRAD3[gi1 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
        const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 =
            t2 *
            t2 *
            (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2 + GRAD3[gi2 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 =
            t3 *
            t3 *
            (GRAD3[gi3] * x3 + GRAD3[gi3 + 1] * y3 + GRAD3[gi3 + 2] * z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3);
};

// 4D simplex noise, better simplex rank ordering method 2012-03-09
/** @internal */
const noise4D = (
    tables: PermTables,
    x: number,
    y: number,
    z: number,
    w: number
): number => {
    const { perm } = tables;
    // Noise contributions from the five corners
    let n0 = 0.0,
        n1 = 0.0,
        n2 = 0.0,
        n3 = 0.0,
        n4 = 0.0;
    // Skew the (x, y, z, w) space to determine which cell of 24 simplices we're in
    // Factor for 4D skewing
    const s = (x + y + z + w) * F4;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const l = Math.floor(w + s);
    // Factor for 4D unskewing
    const t = (i + j + k + l) * G4;
    // Unskew the cell origin back to (x, y, z, w) space
    const x00 = i - t;
    const y00 = j - t;
    const z00 = k - t;
    const w00 = l - t;
    // The x, y, z, w distances from the cell origin
    const x0 = x - x00;
    const y0 = y - y00;
    const z0 = z - z00;
    const w0 = w - w00;
    // For the 4D case, the simplex is a 4D shape I won't even try to describe.
    // To find out which of the 24 possible simplices we're in, we need to
    // determine the magnitude ordering of x0, y0, z0 and w0.
    // Six pair-wise comparisons are performed between each possible pair
    // of the four coordinates, and the results are used to rank the numbers.
    let rankx = 0;
    let ranky = 0;
    let rankz = 0;
    let rankw = 0;
    if (x0 > y0) rankx++;
    else ranky++;
    if (x0 > z0) rankx++;
    else rankz++;
    if (x0 > w0) rankx++;
    else rankw++;
    if (y0 > z0) ranky++;
    else rankz++;
    if (y0 > w0) ranky++;
    else rankw++;
    if (z0 > w0) rankz++;
    else rankw++;
    let i1, j1, k1, l1; // The integer offsets for the second simplex corner
    let i2, j2, k2, l2; // The integer offsets for the third simplex corner
    let i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
    // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x > y > z > w makes x < z, y < w and x < w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // Rank 3 denotes the largest coordinate.
    i1 = rankx >= 3 ? 1 : 0;
    j1 = ranky >= 3 ? 1 : 0;
    k1 = rankz >= 3 ? 1 : 0;
    l1 = rankw >= 3 ? 1 : 0;
    // Rank 2 denotes the second largest coordinate.
    i2 = rankx >= 2 ? 1 : 0;
    j2 = ranky >= 2 ? 1 : 0;
    k2 = rankz >= 2 ? 1 : 0;
    l2 = rankw >= 2 ? 1 : 0;
    // Rank 1 denotes the second smallest coordinate.
    i3 = rankx >= 1 ? 1 : 0;
    j3 = ranky >= 1 ? 1 : 0;
    k3 = rankz >= 1 ? 1 : 0;
    l3 = rankw >= 1 ? 1 : 0;
    // The fifth corner has all coordinate offsets = 1, so no need to compute that.
    // Offsets for second corner in (x,y,z,w) coords
    const x1 = x0 - i1 + G4;
    const y1 = y0 - j1 + G4;
    const z1 = z0 - k1 + G4;
    const w1 = w0 - l1 + G4;
    // Offsets for third corner in (x, y, z, w) coords
    const x2 = x0 - i2 + 2.0 * G4;
    const y2 = y0 - j2 + 2.0 * G4;
    const z2 = z0 - k2 + 2.0 * G4;
    const w2 = w0 - l2 + 2.0 * G4;
    // Offsets for fourth corner in (x, y, z, w) coords
    const x3 = x0 - i3 + 3.0 * G4;
    const y3 = y0 - j3 + 3.0 * G4;
    const z3 = z0 - k3 + 3.0 * G4;
    const w3 = w0 - l3 + 3.0 * G4;
    // Offsets for last corner in (x, y, z, w) coords
    const x4 = x0 - 1.0 + 4.0 * G4;
    const y4 = y0 - 1.0 + 4.0 * G4;
    const z4 = z0 - 1.0 + 4.0 * G4;
    const w4 = w0 - 1.0 + 4.0 * G4;
    // Work out the hashed gradient indices of the five simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const ll = l & 255;
    // Calculate the contribution from the five corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
    if (t0 >= 0) {
        const gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 =
            t0 *
            t0 *
            (GRAD4[gi0] * x0 +
                GRAD4[gi0 + 1] * y0 +
                GRAD4[gi0 + 2] * z0 +
                GRAD4[gi0 + 3] * w0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
    if (t1 >= 0) {
        const gi1 =
            (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] %
                32) *
            4;
        t1 *= t1;
        n1 =
            t1 *
            t1 *
            (GRAD4[gi1] * x1 +
                GRAD4[gi1 + 1] * y1 +
                GRAD4[gi1 + 2] * z1 +
                GRAD4[gi1 + 3] * w1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
    if (t2 >= 0) {
        const gi2 =
            (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] %
                32) *
            4;
        t2 *= t2;
        n2 =
            t2 *
            t2 *
            (GRAD4[gi2] * x2 +
                GRAD4[gi2 + 1] * y2 +
                GRAD4[gi2 + 2] * z2 +
                GRAD4[gi2 + 3] * w2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
    if (t3 >= 0) {
        const gi3 =
            (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] %
                32) *
            4;
        t3 *= t3;
        n3 =
            t3 *
            t3 *
            (GRAD4[gi3] * x3 +
                GRAD4[gi3 + 1] * y3 +
                GRAD4[gi3 + 2] * z3 +
                GRAD4[gi3 + 3] * w3);
    }
    let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
    if (t4 >= 0) {
        const gi4 =
            (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) *
            4;
        t4 *= t4;
        n4 =
            t4 *
            t4 *
            (GRAD4[gi4] * x4 +
                GRAD4[gi4 + 1] * y4 +
                GRAD4[gi4 + 2] * z4 +
                GRAD4[gi4 + 3] * w4);
    }
    // Sum up and scale the result to cover the range [-1,1]
    return 27.0 * (n0 + n1 + n2 + n3 + n4);
};

/** @internal */
interface PermTables {
    perm: Uint8Array;
    permMod12: Uint8Array;
}

/** @internal */
const buildPermutationTables = (random: PRNG): PermTables => {
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    const tmp = new Uint8Array(256);
    for (let i = 0; i < 256; i++) tmp[i] = i;
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(random() * (256 - i));
        const v = tmp[r];
        tmp[r] = tmp[i];
        perm[i] = perm[i + 256] = v;
        permMod12[i] = permMod12[i + 256] = v % 12;
    }
    const v = tmp[255];
    perm[255] = perm[511] = v;
    permMod12[255] = permMod12[511] = v % 12;
    return { perm, permMod12 };
};

/** @internal */
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
/** @internal */
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
/** @internal */
const F3 = 1.0 / 3.0;
/** @internal */
const G3 = 1.0 / 6.0;
/** @internal */
const F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
/** @internal */
const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

/** @internal */
const GRAD3 = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,

    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,

    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

/** @internal */
const GRAD4 = new Float32Array([
    0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,

    0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,

    1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,

    -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,

    1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,

    -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,

    1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,

    -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0,
]);
