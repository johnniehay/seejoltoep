import type { CollectionBeforeChangeHook } from 'payload'

import crypto from 'crypto'

type Props = {
  productsSlug: string
  variantsSlug: string
}

export const beforeChangeCart: (args: Props) => CollectionBeforeChangeHook =
  ({ productsSlug, variantsSlug }) =>
    async ({ data, operation, req }) => {
      // Generate a secret for guest cart access on creation
      if (operation === 'create' && !data.customer && !data.secret) {
        // Generate a cryptographically secure random string
        const secret = crypto.randomBytes(20).toString('hex')
        data.secret = secret

        // Store in context so afterRead hook can include it in the creation response
        if (!req.context) {
          req.context = {}
        }
        req.context.newCartSecret = secret
      }

      // Update subtotal based on items in the cart
      if (data.items && Array.isArray(data.items)) {
        const priceField = `priceIn${data.currency}`

        let subtotal = 0

        for (const item of data.items) {
          if (item.variant) {
            const id = typeof item.variant === 'object' ? item.variant.id : item.variant

            const variant = await req.payload.findByID({
              id,
              collection: variantsSlug as 'variants',
              depth: 1,
              select: {
                [priceField]: true,
                product: true
              },
            })
            const product = typeof variant.product === 'object'? variant.product : null
            subtotal += product?.customInputs?.customPrice ? item.customPrice * 100 : (variant[priceField as keyof typeof variant] as number ?? 0.0) * item.quantity
          } else {
            const id = typeof item.product === 'object' ? item.product.id : item.product

            const product = await req.payload.findByID({
              id,
              collection: productsSlug as 'products',
              depth: 0,
              select: {
                [priceField]: true,
                customInputs: { customPrice:true},
              },
            })

            subtotal += product.customInputs?.customPrice ? item.customPrice * 100 : (product[priceField as keyof typeof product] as number ?? 0.0) * item.quantity
          }
        }

        data.subtotal = subtotal
      } else {
        data.subtotal = 0
      }
    }
