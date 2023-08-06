export class PerlinNoise {
    private permutation: number[];

    constructor() {
        // Generate a random permutation array based on a fixed seed
        this.permutation = this.generatePermutation();
    }

    private generatePermutation(): number[] {
        const permutation: number[] = [];
        for (let i = 0; i < 256; i++) {
            permutation.push(i);
        }

        // Randomize the permutation array using Fisher-Yates shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }

        // Duplicate the permutation array to simplify indexing
        return permutation.concat(permutation);
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    private perlin(x: number, y: number): number {
        // Get integer coordinates of the grid cell
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        // Relative coordinates in the cell
        x -= Math.floor(x);
        y -= Math.floor(y);

        // Compute fade curves for interpolation
        const u = this.fade(x);
        const v = this.fade(y);

        // Hash coordinates of the cell corners
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A];
        const AB = this.permutation[A + 1];
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B];
        const BB = this.permutation[B + 1];

        // Gradient values at the corners
        const gradAA = this.grad(this.permutation[AA], x, y);
        const gradAB = this.grad(this.permutation[AB], x - 1, y);
        const gradBA = this.grad(this.permutation[BA], x, y - 1);
        const gradBB = this.grad(this.permutation[BB], x - 1, y - 1);

        // Interpolate along the x-axis
        const x1 = this.lerp(u, gradAA, gradAB);
        const x2 = this.lerp(u, gradBA, gradBB);

        // Interpolate along the y-axis
        return this.lerp(v, x1, x2);
    }

    public noise(
        x: number,
        y: number,
        frequency: number = 1,
        amplitude: number = 1
    ): number {
        let total = 0;
        let frequencyAcc = frequency;
        let amplitudeAcc = amplitude;

        for (let i = 0; i < 4; i++) {
            total +=
                this.perlin(x * frequencyAcc, y * frequencyAcc) * amplitudeAcc;
            frequencyAcc *= 2;
            amplitudeAcc *= 0.5;
        }

        return total;
    }
}
