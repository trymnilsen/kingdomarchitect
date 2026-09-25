export type TileMask = {
    width: number;
    height: number;
    rows: readonly number[];
};

// bit 31 is the sign bit so shifting into it goes negative
export const MaxTileMaskWidth = 31;

export function createEmptyMask(width: number, height: number): TileMask {
    if (width > MaxTileMaskWidth) {
        throw new Error(
            `A tile mask can be at most ${MaxTileMaskWidth} wide, got ${width}`,
        );
    }
    return {
        width,
        height,
        rows: new Array<number>(height).fill(0),
    };
}

export function isMaskSet(mask: TileMask, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) {
        return false;
    }
    return ((mask.rows[y] >> (mask.width - 1 - x)) & 1) === 1;
}

export function masksEqual(a: TileMask, b: TileMask): boolean {
    if (a.width !== b.width || a.height !== b.height) {
        return false;
    }
    for (let y = 0; y < a.height; y++) {
        if (a.rows[y] !== b.rows[y]) {
            return false;
        }
    }
    return true;
}

export function rotateMaskClockwise(mask: TileMask): TileMask {
    return buildMask(mask.height, mask.width, (x, y) =>
        isMaskSet(mask, y, mask.height - 1 - x),
    );
}

export function mirrorMask(mask: TileMask): TileMask {
    return buildMask(mask.width, mask.height, (x, y) =>
        isMaskSet(mask, mask.width - 1 - x, y),
    );
}

export function orientMask(
    mask: TileMask,
    quarterTurns: number,
    mirrored: boolean,
): TileMask {
    let oriented = mask;
    if (mirrored) {
        oriented = mirrorMask(oriented);
    }
    for (let turn = 0; turn < quarterTurns % 4; turn++) {
        oriented = rotateMaskClockwise(oriented);
    }
    return oriented;
}

export function masksOverlap(
    target: TileMask,
    source: TileMask,
    offsetX: number,
    offsetY: number,
): boolean {
    for (let sourceY = 0; sourceY < source.height; sourceY++) {
        const targetY = sourceY + offsetY;
        if (targetY < 0 || targetY >= target.height) {
            continue;
        }
        const aligned = alignRow(target, source, sourceY, offsetX);
        if ((target.rows[targetY] & aligned) !== 0) {
            return true;
        }
    }
    return false;
}

export function stampMask(
    target: TileMask,
    source: TileMask,
    offsetX: number,
    offsetY: number,
): TileMask {
    const rows = [...target.rows];
    for (let sourceY = 0; sourceY < source.height; sourceY++) {
        const targetY = sourceY + offsetY;
        if (targetY < 0 || targetY >= target.height) {
            continue;
        }
        rows[targetY] |= alignRow(target, source, sourceY, offsetX);
    }
    return {
        width: target.width,
        height: target.height,
        rows,
    };
}

function alignRow(
    target: TileMask,
    source: TileMask,
    sourceY: number,
    offsetX: number,
): number {
    // early out or the shift below wraps at 32
    if (offsetX >= target.width || offsetX + source.width <= 0) {
        return 0;
    }
    const row = source.rows[sourceY];
    const shift = target.width - offsetX - source.width;
    let aligned: number;
    if (shift >= 0) {
        aligned = row << shift;
    } else {
        aligned = row >> -shift;
    }
    const targetBits = (1 << target.width) - 1;
    return aligned & targetBits;
}

function buildMask(
    width: number,
    height: number,
    isSet: (x: number, y: number) => boolean,
): TileMask {
    const rows: number[] = [];
    for (let y = 0; y < height; y++) {
        let row = 0;
        for (let x = 0; x < width; x++) {
            row = row << 1;
            if (isSet(x, y)) {
                row = row | 1;
            }
        }
        rows.push(row);
    }
    return { width, height, rows };
}
