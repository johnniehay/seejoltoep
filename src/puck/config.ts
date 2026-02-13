'use client'

import { fullConfig, extendConfig} from '@delmaredigital/payload-puck/config/editor'
import { HeroConfig } from "@/puck/components/Hero/client";
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
  },
  categories: {
    custom: {
      title: 'Custom',
      components: ['Hero'],
    },
  },
})


export const puckConfig = customConfig;
