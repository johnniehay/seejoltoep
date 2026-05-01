'use client'

import { fullConfig, extendConfig} from '@delmaredigital/payload-puck/config/editor'
import { HeroConfig } from "@/puck/components/Hero/client";
import { IframeConfig } from "@/puck/components/Iframe/client";
import { FormConfig } from "@/puck/components/Form/client";
import { ShopConfig } from "@/puck/components/Shop/client";
/**
 * Puck Editor Configuration
 *
 * Uses the full built-in config which includes:
 * - Section, Flex, Grid, Columns
 * - Heading, Text, RichText
 * - Button, Image, Video
 * - Spacer, Divider
 *
 * Extend this with custom components as needed:
 */

const customConfig = extendConfig({
  base: fullConfig,
  components: {
    Hero: HeroConfig,
    Iframe: IframeConfig,
    Form: FormConfig,
    Shop: ShopConfig
  },
  categories: {
    custom: {
      title: 'Custom',
      components: ['Hero','Iframe','Form','Shop'],
    },
  },
})


export const puckConfig = customConfig;
