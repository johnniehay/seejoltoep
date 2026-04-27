/**
 * Server-safe Puck Configuration
 *
 * This config is used for server-side rendering with HybridPageRenderer.
 * All components are server-safe (no 'use client' directive, no React hooks).
 */

import { baseConfig, extendConfig } from '@delmaredigital/payload-puck/config';
import { Hero } from "@/puck/components/Hero/server";
import { Iframe } from "@/puck/components/Iframe/server";

/**
 * Server-safe base configuration
 *
 * Uses the built-in base config which includes server-safe versions of:
 * - Section, Flex, Grid, Columns
 * - Heading, Text, RichText
 * - Button, Image, Video
 * - Spacer, Divider
 *
 * Extend this with custom server-safe components as needed:
 *
 * import { extendConfig } from '@delmaredigital/payload-puck/config'
 *
 * export const serverConfig = extendConfig({
 *   base: baseConfig,
 *   components: {
 *     MyComponent: MyComponentServerConfig,
 *   },
 * })
 */
const customServerConfig = extendConfig({
  base: baseConfig,
  components: {
    Hero: Hero,
    Iframe: Iframe
  },
  categories: {
    custom: {
      title: 'Custom',
      components: ['Hero','Iframe'],
    },
  },
})
export const puckServerConfig = customServerConfig
