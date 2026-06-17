
// modified from zpao/qrcode.react/src/index.tsx
/**
 * @license qrcode.react
 * Copyright (c) Paul O'Shannessy
 * SPDX-License-Identifier: ISC
 */

import {
  CanvasHTMLAttributes,
  forwardRef,
  PropsWithChildren,
  // useMemo,
} from 'react';
import qrcodegen from './third-party-qrcodegen';
import { Path, Svg, SVGProps } from "@react-pdf/renderer";

type Modules = ReturnType<qrcodegen.QrCode['getModules']>;
type Excavation = {x: number; y: number; w: number; h: number};
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
type CrossOrigin = 'anonymous' | 'use-credentials' | '' | undefined;

type ERROR_LEVEL_MAPPED_TYPE = {
  [index in ErrorCorrectionLevel]: qrcodegen.QrCode.Ecc;
};

const ERROR_LEVEL_MAP: ERROR_LEVEL_MAPPED_TYPE = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;

type ImageSettings = {
  /**
   * The URI of the embedded image.
   */
  src: string;
  /**
   * The height, in pixels, of the image.
   */
  height: number;
  /**
   * The width, in pixels, of the image.
   */
  width: number;
  /**
   * Whether or not to "excavate" the modules around the embedded image. This
   * means that any modules the embedded image overlaps will use the background
   * color.
   */
  excavate: boolean;
  /**
   * The horiztonal offset of the embedded image, starting from the top left corner.
   * Will center if not specified.
   */
  x?: number;
  /**
   * The vertical offset of the embedded image, starting from the top left corner.
   * Will center if not specified.
   */
  y?: number;
  /**
   * The opacity of the embedded image in the range of 0-1.
   * @defaultValue 1
   */
  opacity?: number;
  /**
   * The cross-origin value to use when loading the image. This is used to
   * ensure compatibility with CORS, particularly when extracting image data
   * from QRCodeCanvas.
   * Note: `undefined` is treated differently than the seemingly equivalent
   * empty string. This is intended to align with HTML behavior where omitting
   * the attribute behaves differently than the empty string.
   */
  crossOrigin?: CrossOrigin;
};

type QRProps = {
  /**
   * The value to encode into the QR Code. An array of strings can be passed in
   * to represent multiple segments to further optimize the QR Code.
   */
  value: string | string[];
  /**
   * The size, in pixels, to render the QR Code.
   * @defaultValue 128
   */
  size?: number;
  /**
   * The Error Correction Level to use.
   * @see https://www.qrcode.com/en/about/error_correction.html
   * @defaultValue L
   */
  level?: ErrorCorrectionLevel;
  /**
   * The background color used to render the QR Code.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
   * @defaultValue #FFFFFF
   */
  bgColor?: string;
  /**
   * The foreground color used to render the QR Code.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
   * @defaultValue #000000
   */
  fgColor?: string;
  /**
   * Whether or not a margin of 4 modules should be rendered as a part of the
   * QR Code.
   * @deprecated Use `marginSize` instead.
   * @defaultValue false
   */
  includeMargin?: boolean;
  /**
   * The number of _modules_ to use for margin. The QR Code specification
   * requires `4`, however you can specify any number. Values will be turned to
   * integers with `Math.floor`. Overrides `includeMargin` when both are specified.
   * @defaultValue 0
   */
  marginSize?: number;
  /**
   * The title to assign to the QR Code. Used for accessibility reasons.
   */
  title?: string;
  /**
   * The minimum version used when encoding the QR Code. Valid values are 1-40
   * with higher values resulting in more complex QR Codes. The optimal
   * (lowest) version is determined for the `value` provided, using `minVersion`
   * as the lower bound.
   * @defaultValue 1
   */
  minVersion?: number;
  /**
   * If enabled, the Error Correction Level of the result may be higher than
   * the specified Error Correction Level option if it can be done without
   * increasing the version.
   * @defaultValue true
   */
  boostLevel?: boolean;
  /**
   * The settings for the embedded image.
   */
  imageSettings?: ImageSettings;
};
// type QRPropsCanvas = QRProps & CanvasHTMLAttributes<HTMLCanvasElement>;
type QRPropsSVG = QRProps & PropsWithChildren<SVGProps>;

const DEFAULT_SIZE = 128;
const DEFAULT_LEVEL: ErrorCorrectionLevel = 'L';
const DEFAULT_BGCOLOR = '#FFFFFF';
const DEFAULT_FGCOLOR = '#000000';
const DEFAULT_INCLUDEMARGIN = false;
const DEFAULT_MINVERSION = 1;

const SPEC_MARGIN_SIZE = 4;
const DEFAULT_MARGIN_SIZE = 0;

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

function generatePath(modules: Modules, margin: number = 0): string {
  const ops: Array<string> = [];
  modules.forEach(function (row, y) {
    let start: number | null = null;
    row.forEach(function (cell, x) {
      if (!cell && start !== null) {
        // M0 0h7v1H0z injects the space with the move and drops the comma,
        // saving a char per operation
        ops.push(
          `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`
        );
        start = null;
        return;
      }

      // end of row, clean up or skip
      if (x === row.length - 1) {
        if (!cell) {
          // We would have closed the op above already so this can only mean
          // 2+ light modules in a row.
          return;
        }
        if (start === null) {
          // Just a single dark module.
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
        } else {
          // Otherwise finish the current line.
          ops.push(
            `M${start + margin},${y + margin} h${x + 1 - start}v1H${
              start + margin
            }z`
          );
        }
        return;
      }

      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join('');
}

// We could just do this in generatePath, except that we want to support
// non-Path2D canvas, so we need to keep it an explicit step.
function excavateModules(modules: Modules, excavation: Excavation): Modules {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row;
    }
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell;
      }
      return false;
    });
  });
}

function getImageSettings(
  cells: Modules,
  size: number,
  margin: number,
  imageSettings?: ImageSettings
): null | {
  x: number;
  y: number;
  h: number;
  w: number;
  excavation: Excavation | null;
  opacity: number;
  crossOrigin: CrossOrigin;
} {
  if (imageSettings == null) {
    return null;
  }
  const numCells = cells.length + margin * 2;
  const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
  const scale = numCells / size;
  const w = (imageSettings.width || defaultSize) * scale;
  const h = (imageSettings.height || defaultSize) * scale;
  const x =
    imageSettings.x == null
      ? cells.length / 2 - w / 2
      : imageSettings.x * scale;
  const y =
    imageSettings.y == null
      ? cells.length / 2 - h / 2
      : imageSettings.y * scale;
  const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;

  let excavation = null;
  if (imageSettings.excavate) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const ceilW = Math.ceil(w + x - floorX);
    const ceilH = Math.ceil(h + y - floorY);
    excavation = {x: floorX, y: floorY, w: ceilW, h: ceilH};
  }

  const crossOrigin = imageSettings.crossOrigin;

  return {x, y, h, w, excavation, opacity, crossOrigin};
}

function getMarginSize(includeMargin: boolean, marginSize?: number): number {
  if (marginSize != null) {
    return Math.max(Math.floor(marginSize), 0);
  }
  return includeMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE;
}

function useQRCode({
                     value,
                     level,
                     minVersion,
                     includeMargin,
                     marginSize,
                     imageSettings,
                     size,
                     boostLevel,
                   }: {
  value: string | string[];
  level: ErrorCorrectionLevel;
  minVersion: number;
  includeMargin: boolean;
  marginSize?: number;
  imageSettings?: ImageSettings;
  size: number;
  boostLevel?: boolean;
}) {
  const qrcode = (() => {
  // const qrcode = useMemo(() => {
    const values = Array.isArray(value) ? value : [value];
    const segments = values.reduce<qrcodegen.QrSegment[]>((accum, v) => {
      accum.push(...qrcodegen.QrSegment.makeSegments(v));
      return accum;
    }, []);
    return qrcodegen.QrCode.encodeSegments(
      segments,
      ERROR_LEVEL_MAP[level],
      minVersion,
      undefined,
      undefined,
      boostLevel
    );
  })();
  // }, [value, level, minVersion, boostLevel]);

  const {cells, margin, numCells, calculatedImageSettings} =
    (() => {
    // useMemo(() => {
      const cells = qrcode.getModules();

      const margin = getMarginSize(includeMargin, marginSize);
      const numCells = cells.length + margin * 2;
      const calculatedImageSettings = getImageSettings(
        cells,
        size,
        margin,
        imageSettings
      );
      return {
        cells,
        margin,
        numCells,
        calculatedImageSettings,
      };
    })();
    // }, [qrcode, size, imageSettings, includeMargin, marginSize]);

  return {
    qrcode,
    margin,
    cells,
    numCells,
    calculatedImageSettings,
  };
}


const QRCodeSVGPDF = forwardRef<Svg, QRPropsSVG>(
  function QRCodeSVGPDF(props, forwardedRef) {
    const {
      value,
      size = DEFAULT_SIZE,
      level = DEFAULT_LEVEL,
      bgColor = DEFAULT_BGCOLOR,
      fgColor = DEFAULT_FGCOLOR,
      includeMargin = DEFAULT_INCLUDEMARGIN,
      minVersion = DEFAULT_MINVERSION,
      boostLevel,
      title,
      marginSize,
      imageSettings,
      ...otherProps
    } = props;

    const {margin, cells, numCells, calculatedImageSettings} = useQRCode({
      value,
      level,
      minVersion,
      boostLevel,
      includeMargin,
      marginSize,
      imageSettings,
      size,
    });

    let cellsToDraw = cells;
    let image = null;
    if (imageSettings != null && calculatedImageSettings != null) {
      if (calculatedImageSettings.excavation != null) {
        cellsToDraw = excavateModules(
          cells,
          calculatedImageSettings.excavation
        );
      }

      image = (
        <image
          href={imageSettings.src}
          height={calculatedImageSettings.h}
          width={calculatedImageSettings.w}
          x={calculatedImageSettings.x + margin}
          y={calculatedImageSettings.y + margin}
          preserveAspectRatio="none"
          opacity={calculatedImageSettings.opacity}
          // Note: specified here always, but undefined will result in no attribute.
          crossOrigin={calculatedImageSettings.crossOrigin}
        />
      );
    }

    // Drawing strategy: instead of a rect per module, we're going to create a
    // single path for the dark modules and layer that on top of a light rect,
    // for a total of 2 DOM nodes. We pay a bit more in string concat but that's
    // way faster than DOM ops.
    // For level 1, 441 nodes -> 2
    // For level 40, 31329 -> 2
    const fgPath = generatePath(cellsToDraw, margin);

    return (
      <Svg
        height={size}
        width={size}
        viewBox={`0 0 ${numCells} ${numCells}`}
        // ref={forwardedRef}
        // role="img"
        {...otherProps}>
        {!!title && <title>{title}</title>}
        <Path
          fill={bgColor}
          d={`M0,0 h${numCells}v${numCells}H0z`}
          // shapeRendering="crispEdges"
        />
        <Path fill={fgColor} d={fgPath} /*shapeRendering="crispEdges"*/ />
        {image}
      </Svg>
    );
  }
);
QRCodeSVGPDF.displayName = 'QRCodeSVGPDF';

export {QRCodeSVGPDF};