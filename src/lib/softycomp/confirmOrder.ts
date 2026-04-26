import { APIError } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

/**
 * confirmOrder for SoftyComp is a redirect handler.
 * It DOES NOT finalize the transaction via SoftyComp API, as only the callback provides the source of truth.
 * It waits for the callback to create the order, or creates the order if it's safe to assume success upon landing on SuccessURL.
 */
export const confirmOrder: NonNullable<PaymentAdapter>['confirmOrder'] = async ({
  data,
  req,
  transactionsSlug = 'transactions',
}) => {
  const { payload } = req
  const { userReference } = data

  if (!userReference) {
    throw new APIError('userReference is required to confirm redirect', 400)
  }

  try {
    // 1. Find the transaction
    const transactions = await payload.find({
      collection: transactionsSlug as 'transactions',
      where: {
        'softycomp.userReference': { equals: userReference },
      },
      req,
    })

    const transaction = transactions.docs[0]

    if (!transaction) {
      throw new APIError('Transaction not found', 404)
    }

    // 2. Check if order was already created by callback
    if (transaction.order) {
      const order = typeof transaction.order === 'object'
        ? transaction.order
        : await payload.findByID({ collection: 'orders', id: transaction.order, req })

      return {
        message: 'Payment already confirmed successfully',
        orderID: order.id,
        transactionID: transaction.id,
        ...(order.accessToken ? { accessToken: order.accessToken } : {}),
      }
    }

    // 3. Landing on SuccessURL usually implies the payment was completed.
    // We create the order in a 'pending' status if the callback hasn't arrived yet.
    // The callback will then finalize it by marking it published/paid.

    const order = await payload.create({
      collection: 'orders',
      data: {
        amount: transaction.amount,
        currency: transaction.currency || 'ZAR',
        customer: transaction.customer,
        customerEmail: transaction.customerEmail,
        items: transaction.items,
        shippingAddress: (transaction as any).softycomp?.shippingAddress || undefined,
        status: 'pending',
        transactions: [transaction.id],
      },
      req,
    })

    // Update transaction to link to this order
    await payload.update({
      collection: transactionsSlug as 'transactions',
      id: transaction.id,
      data: {
        order: order.id,
      },
      req,
    })

    if (transaction.cart) {
      await payload.update({
        collection: 'carts',
        id: typeof transaction.cart === 'object' ? transaction.cart.id : transaction.cart,
        data: {
          status: 'purchased',
        },
        req,
      })
    }

    return {
      message: 'Order created, awaiting final payment confirmation',
      orderID: order.id,
      transactionID: transaction.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }

  } catch (error) {
    if (error instanceof APIError) throw error
    payload.logger.error({ err: error, msg: 'Error in SoftyComp confirmOrder redirect' })
    throw new APIError('Order confirmation failed', 500)
  }
}
