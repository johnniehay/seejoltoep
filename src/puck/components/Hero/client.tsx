import { ComponentConfig } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  createDimensionsField,
} from '@delmaredigital/payload-puck/fields'
import { HeroComponent, HeroProps } from "@/puck/components/Hero/index";

export const HeroConfig: ComponentConfig<HeroProps> = {
  label: 'Hero',
  fields: {
    image: createMediaField({ label: 'Background Image' }),
    overlay: createBackgroundField({ label: 'Overlay' }),
    padding: createPaddingField({ label: 'Padding' }),
    dimensions: createDimensionsField({ label: 'Dimensions' }),
  },
  defaultProps: {
    image: null,
    overlay: null,
    padding: { top: 80, bottom: 80, left: 24, right: 24, unit: 'px', linked: false },
    dimensions: null
  },
  render:HeroComponent
}
