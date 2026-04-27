import { ComponentConfig, PuckComponent, WithId, WithPuckProps } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  backgroundValueToCSS,
  paddingValueToCSS,
  createDimensionsField,
  dimensionsValueToCSS, MediaReference, BackgroundValue, PaddingValue, DimensionsValue,
} from '@delmaredigital/payload-puck/fields'

export type IframeProps = {
  src?: string,
  srcdoc?: string,
  height: number,
  title: string,
}

export const IframeComponent: PuckComponent<IframeProps> = ({ src,srcdoc, height, title }: IframeProps) => (
  <iframe
    src={src}
    srcDoc={srcdoc}
    title={title}
    width="100%"
    height={height}
    loading="lazy" // Best practice for performance
    style={{ border: "none" }}
  />
)



