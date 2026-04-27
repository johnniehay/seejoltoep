import { ComponentConfig } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  createDimensionsField,
} from '@delmaredigital/payload-puck/fields'
import { IframeComponent, IframeProps } from "@/puck/components/Iframe/index";

export const IframeConfig: ComponentConfig<IframeProps> = {
  label: 'Iframe',
  fields: {
    src: {
      type: "text",
      label: "Source URL"
    },
    srcdoc: {
      type: "text",
      label: "Source HTML"
    },
    height: {
      type: "number",
      label: "Height (px)",
      min: 100,
      max: 2000
    },
    title: {
      type: "text",
      label: "Accessible Title"
    },
  },
  defaultProps: {
    src: "https://example.com",
    height: 400,
    title: "Embedded Content",
  },
  render:IframeComponent
}
