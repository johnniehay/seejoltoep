import type { Endpoint } from 'payload'

export const softyCompCallbackEndpoint: Endpoint = {
  path: '/callback',
  method: 'post',
  handler: async (req) => {
    const { payload } = req
    let body
    try {
      if (!req.json) throw "req.json undefined"
      body = await req.json()
    } catch (err) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    payload.logger.info({ msg: 'SoftyComp callback received', body })

    const {
      reference, // Guid from SoftyComp
      activityTypeID, // 5 = Success, 6 = Failed
      amount,
      userReference, // Our unique reference
      information,
    } = body

    if (!userReference) {
      return Response.json({ error: 'userReference is required' }, { status: 400 })
    }

    try {
      // 1. Find the transaction
      const transactions = await payload.find({
        collection: 'transactions',
        where: {
          'softycomp.userReference': { equals: userReference },
          'softycomp.billReference': { equals: reference },
        },
        req,
      })

      const transaction = transactions.docs[0]

      if (!transaction) {
        payload.logger.warn(`No transaction found for SoftyComp userReference: ${userReference}`)
        return Response.json({ received: true })
      }

      // If already succeeded, don't repeat the work
      if (transaction.status === 'succeeded' && transaction.order) {
        return Response.json({ received: true })
      }

      // activityTypeID: 5 = Payment Successful, 6 = Payment Failure
      if (activityTypeID === 5) {
        // 2. Create Order if not exists
        let orderId = transaction.order as string

        if (!orderId) {
          const order = await payload.create({
            collection: 'orders',
            data: {
              amount: transaction.amount,
              currency: transaction.currency || 'ZAR',
              customer: transaction.customer,
              customerEmail: transaction.customerEmail,
              items: transaction.items,
              shippingAddress: transaction.softycomp?.shippingAddress,
              status: 'processing',
              transactions: [transaction.id],
            },
            req,
          })
          orderId = order.id
        } else {
           // Ensure it is published if it was previously created as a draft/processing
           await payload.update({
             collection: 'orders',
             id: orderId,
             data: {
               status: 'processing',
             },
             req,
           })
        }

        // 3. Mark Transaction as succeeded
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: {
            status: 'succeeded',
            order: orderId,
          },
          req,
        })

        // 4. Mark Cart as purchased
        if (transaction.cart) {
          const cartId = typeof transaction.cart === 'object' ? transaction.cart.id : transaction.cart
          await payload.update({
            collection: 'carts',
            id: cartId,
            data: {
              purchasedAt: new Date().toISOString(),
            },
            req,
          })
        }

        await payload.update({
          collection: 'eitems',
          where: {id: {in: transaction.items}},
          data: {_status: 'published'},
          req,
        })

        payload.logger.info(`Order ${orderId} finalized via SoftyComp callback`)
      } else if (activityTypeID === 6) {
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: {
            status: 'failed',
          },
          req,
        })
        payload.logger.error(`SoftyComp payment failed for transaction ${transaction.id}: ${information}`)
      }

      return Response.json(true)
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error processing SoftyComp callback' })
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
}
