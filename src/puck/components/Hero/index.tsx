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

export type HeroProps = {
  image: MediaReference | null,
  overlay: BackgroundValue | null,
  padding: PaddingValue | null,
  dimensions: DimensionsValue | null,
}

export const HeroComponent: PuckComponent<HeroProps> = ({ image, overlay, padding, dimensions }: HeroProps) => (
  <section
    style={{
      ...backgroundValueToCSS(overlay),
      ...dimensionsValueToCSS(dimensions),
      padding: paddingValueToCSS(padding),
    }}
  >
    {/* Hero content */}
  </section>
)


// export type HeroProps = WithId<WithPuckProps<typeof HeroConfig>>


