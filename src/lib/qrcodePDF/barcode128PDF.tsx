import React, { forwardRef, PropsWithChildren } from 'react';
import { Path, Svg, SVGProps } from "@react-pdf/renderer";
import { encodeCode128B, generateBarcodePath } from './encoding128';

export type Barcode128Props = {
  /**
   * The value to encode into the Barcode.
   */
  value: string | number;
  /**
   * The width of the barcode container in points.
   * @defaultValue 200
   */
  width?: string | number;
  /**
   * The height of the barcode in points.
   * @defaultValue 40
   */
  height?: string | number;
  /**
   * The background color.
   * @defaultValue #FFFFFF
   */
  bgColor?: string;
  /**
   * The color of the bars.
   * @defaultValue #000000
   */
  fgColor?: string;
  /**
   * The quiet zone (margin) size in modules.
   * @defaultValue 10
   */
  marginSize?: number;
  /**
   * Accessibility title.
   */
  title?: string;
};

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 40;
const DEFAULT_MARGIN_SIZE = 10;
const DEFAULT_BGCOLOR = '#FFFFFF';
const DEFAULT_FGCOLOR = '#000000';

/**
 * Barcode128PDF Component
 * Renders a Code 128 (Subset B) barcode using SVG components from @react-pdf/renderer.
 * Uses a single path strategy for optimized PDF rendering.
 */
const Barcode128PDF = forwardRef<Svg, Barcode128Props & PropsWithChildren<SVGProps>>(
  function Barcode128PDF(props, forwardedRef) {
    const {
      value,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      marginSize = DEFAULT_MARGIN_SIZE,
      bgColor = DEFAULT_BGCOLOR,
      fgColor = DEFAULT_FGCOLOR,
      title,
      children,
      ...otherProps
    } = props;

    const { path, totalWidth } = (() => {
      try {
        const patterns = encodeCode128B(value);
        return generateBarcodePath(patterns, marginSize);
      } catch (err) {
        console.error("Barcode128PDF encoding error:", err);
        return { path: "", totalWidth: 1 };
      }
    })();

    return (
      <Svg
        width={width}
        height={height}
        // Using 100 as height for better precision in path rendering
        viewBox={`0 0 ${totalWidth} 100`}
        preserveAspectRatio="none"
        {...otherProps}
      >
        {!!title && <title>{title}</title>}
        <Path fill={bgColor} d={`M0 0h${totalWidth}v100H0z`} />
        {path ? <Path fill={fgColor} d={path} /> : null}
        {children}
      </Svg>
    );
  }
);

Barcode128PDF.displayName = 'Barcode128PDF';

export { Barcode128PDF };
