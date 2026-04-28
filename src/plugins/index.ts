import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { createPuckPlugin } from '@delmaredigital/payload-puck/plugin'
import { puckLayoutOptions } from '@/lib/puck/layout-options'
import { getServerSideURL } from '@/utilities/getURL'
import { authjsPlugin } from "payload-authjs";
import { authConfig } from "@/auth.config";
import { googleSheetsPlugin } from './google-sheets'
import { sasImportPlugin } from "@/plugins/sas-import";
import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import { checkFieldPermission, checkPermission, checkPermissionOrWhere } from "@/access/checkPermission";
import { customerOnlyFieldAccess } from "@/access/ecommerce/customerOnlyFieldAccess";
import { isDocumentOwner } from "@/access/ecommerce/isDocumentOwner";
import { ProductsCollection } from "@/collections/Products";
import { CurrenciesConfig } from "@payloadcms/plugin-ecommerce/types";
import { softyCompAdapter } from '@/lib/softycomp'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Seejol Toep` : 'Seejol Toep'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const currencies: CurrenciesConfig = {
    supportedCurrencies: [
      {
        code: 'ZAR',
        decimals: 2,
        label: 'South African Rand',
        symbol: 'R',
      },
    ],
    defaultCurrency: 'ZAR',
  }

export const plugins: Plugin[] = [
  authjsPlugin({
      authjsConfig: authConfig,
      enableLocalStrategy: true,
  }),
  googleSheetsPlugin({
    enabled: true,
    collections: ['lede', 'inskrywings', 'inklokke', 'presensie', 'aktiwiteit']
  }),
  sasImportPlugin({
    enabled: true,
    collections: []
  }),
  createPuckPlugin({
    pagesCollection: 'pages', // Collection slug (default: 'pages')
    autoGenerateCollection: true,
    collectionOverrides: {access:{readVersions: () =>true, read: () =>true}},
    layouts: puckLayoutOptions,
    editorStylesheet: 'src/app/(frontend)/globals.css',
    editorStylesheetCompiled: '/puck-editor-styles.css', // manually extracted from dev /api/puck/styles
  }),
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      access:{
        create: checkPermission("all:forms"),
        update: checkPermission("all:forms"),
        delete: checkPermission("all:forms"),
        read: checkPermission("all:forms"),
        readVersions: checkPermission("all:forms"),
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    formSubmissionOverrides:{
      access:{
        create: () => true,
        update: checkPermission("all:forms"),
        delete: checkPermission("all:forms"),
        read: checkPermission("all:forms"),
        readVersions: checkPermission("all:forms"),
      },
    }
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess: checkFieldPermission("admin:winkel"),
      adminOrPublishedStatus: checkPermissionOrWhere("admin:winkel",{_status: { equals: 'published' }}),
      customerOnlyFieldAccess,
      isCustomer:customerOnlyFieldAccess,
      isAdmin: checkPermission("admin:winkel"),
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    currencies,
    addresses: {
      supportedCountries: [{ label: 'South Africa', value: 'ZA' }]
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields.map((field) => {
            if ('name' in field && field.name === 'status' && field.type === 'select') {
              return {
                ...field,
                options: [...(field.options || []), { label: 'Pending', value: 'pending'}],
              }
            }
            return field
          }),
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
        ],
      }),
    },
    payments: {
      paymentMethods: [softyCompAdapter()],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
