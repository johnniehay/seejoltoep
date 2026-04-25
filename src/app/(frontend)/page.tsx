import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import Link from 'next/link'

import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './[slug]/page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { HybridPageRenderer, type HybridPageData } from '@delmaredigital/payload-puck/render'
import { puckServerConfig } from '@/puck/config.server'
import { puckRenderLayouts } from '@/lib/puck/render-layouts'
import TempHome from "@/app/(frontend)/temphome/page";

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()

  const page = await queryHomepage()

  // Fallback for new installations with no homepage
  if (!page) {
    return <TempHome />
  }

  const url = '/'

  return (
    <article>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <HybridPageRenderer
        page={page as unknown as HybridPageData}
        config={puckServerConfig}
        layouts={puckRenderLayouts}
        legacyRenderer={() => (
          <div className="container py-16">
            <p>This page uses a legacy format. Please edit it in the Puck editor to update.</p>
          </div>
        )}
      />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await queryHomepage()

  if (!page) {
    return {
      title: 'Seejol Toep',
      description: 'Die Toepassing vir Seejol Voortrekkerkamp',
    }
  }

  return generateMeta({ doc: page })
}

// const queryHomepage = cache(async () => {
const queryHomepage = cache(async () => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  // First try to find a page marked as homepage
  const homepageResult = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      isHomepage: {
        equals: true,
      },
    },
  })

  if (homepageResult.docs?.[0]) {
    return homepageResult.docs[0] as RequiredDataFromCollectionSlug<'pages'>
  }

  // Fallback: look for a page with slug 'home'
  const homeSlugResult = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: 'home',
      },
    },
  })

  return (homeSlugResult.docs?.[0] as RequiredDataFromCollectionSlug<'pages'>) || null
})
