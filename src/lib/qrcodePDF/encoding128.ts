/**
 * Code 128 Encoding Utility
 * Based on standard Code 128 specifications.
 */

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322211', '212123', // 20-29
  '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', // 30-39
  '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', // 40-49
  '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', // 50-59
  '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', // 60-69
  '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', // 70-79
  '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', // 80-89
  '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', // 90-99
  '311141', '411131', '211412', '211214', '211232', '2331112', // 100-105
];

// Based on the array provided: 102=StartA, 103=StartB, 104=StartC, 105=Stop
// Standard Code 128 usually has 107 patterns, but we match your array indices.
export const START_B = 103;
export const STOP = 105;

/**
 * Encodes a string into Code 128 Subset B patterns.
 * Includes Start B, data characters, Modulo 103 checksum, and Stop.
 */
export function encodeCode128B(input: string | number): string[] {
  const value = String(input);
  const patterns: string[] = [];
  let checksum = START_B;

  // Start Character
  patterns.push(CODE128_PATTERNS[START_B]);

  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    const code = charCode - 32; // Offset for Subset B (ASCII 32-127)

    if (code < 0 || code > 102) {
      throw new Error(`Character '${value[i]}' is not supported in Code 128 Subset B.`);
    }

    patterns.push(CODE128_PATTERNS[code]);
    checksum += code * (i + 1);
  }

  // Checksum
  patterns.push(CODE128_PATTERNS[checksum % 103]);

  // Stop Character
  patterns.push(CODE128_PATTERNS[STOP]);

  return patterns;
}

/**
 * Generates an SVG Path 'd' string for the barcode patterns.
 * Each digit in the pattern alternates between Bar and Space widths.
 * We use a height of 100 for better precision in the react-pdf renderer.
 */
export function generateBarcodePath(patterns: string[], margin: number): { path: string; totalWidth: number } {
  let x = margin;
  const ops: string[] = [];

  for (const pattern of patterns) {
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10);
      if (i % 2 === 0) {
        // Compact SVG path format to match qrcodePDF.tsx
        ops.push(`M${x} 0h${width}v100H${x}z`);
      }
      x += width;
    }
  }

  return {
    path: ops.join(''),
    totalWidth: x + margin,
  };
}
