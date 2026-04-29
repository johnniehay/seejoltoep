import { APIError } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

async function getSoftyCompToken() {
  const providedURL = process.env.SOFTYCOMP_URL
  const apiKey = process.env.SOFTYCOMP_API_KEY
  const apiSecret = process.env.SOFTYCOMP_API_SECRET

  if (!providedURL || !apiKey || !apiSecret) {
    throw new Error('SOFTYCOMP_URL, SOFTYCOMP_API_KEY, and SOFTYCOMP_API_SECRET must be defined')
  }

  const response = await fetch(`${providedURL}auth/generatetoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, apiSecret }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate SoftyComp authentication token')
  }

  const { token } = await response.json()
  return token
}

export const initiatePayment: NonNullable<PaymentAdapter>['initiatePayment'] = async ({
  data,
  req,
  transactionsSlug = 'transactions' ,
}) => {
  const { payload } = req
  const { customerEmail, billingAddress, shippingAddress, cart } = data
  const amount = cart.subtotal

  const providedURL = process.env.SOFTYCOMP_URL
  if (!providedURL) {
    throw new APIError('SOFTYCOMP_URL is not defined', 500)
  }

  if (!customerEmail) {
    throw new APIError('Customer email is required', 400)
  }

  if (!amount || amount <= 0) {
    throw new APIError('Valid amount is required', 400)
  }

  let token: string
  try {
    token = await getSoftyCompToken()
  } catch (err) {
    payload.logger.error({ err, msg: 'SoftyComp Auth Failed' })
    throw new APIError('Payment gateway authentication failed', 500)
  }

  // Generate unique UserReference for SoftyComp
  const userReference = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  // SoftyComp requestbillpresentment typically expects a single summary item


  const items = [{
    Description: `Seejol betaling vir waentjieID ${cart.id}`,
    Amount: amount / 100,
    FrequencyTypeID: 1, // Once-off
  }]

  const scBody = {
    Name: `${billingAddress?.firstName || ''} ${billingAddress?.lastName || ''}`.trim() || 'Customer',
    EmailAddress: customerEmail,
    UserReference: userReference,
    ModeTypeID: 3, // Website Bill
    ScheduledDateTime: new Date().toISOString(),
    CallbackURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/softycomp/callback`,
    SuccessURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order?method=softycomp&userReference=${userReference}`,
    NotifyURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout?error=payment_failed`,
    CancelURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout?error=payment_cancelled`,
    Language: 'AF',
    Items: items,
  }

  try {
    payload.logger.info(`requestbillpresentment body ${JSON.stringify(scBody)}`)
    const response = await fetch(`${providedURL}paygatecontroller/requestbillpresentment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scBody),
    })

    const result = await response.json()

    if (!response.ok || !result.success || !result.paymentURL) {
      payload.logger.error({ msg: 'SoftyComp Error', result })
      throw new APIError(result.message || 'Failed to initiate SoftyComp payment', 500)
    }

    // Create the transaction in Payload BEFORE redirecting
    await payload.create({
      collection: transactionsSlug as 'transactions',
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: amount,
        billingAddress,
        cart: cart.id,
        currency: 'ZAR',
        items: cart.items.map(item => ({
          product: typeof item.product === 'object' ? item.product.id : item.product,
          quantity: item.quantity,
          variant: typeof item.variant === 'object' ? item.variant.id : item.variant,
          lidnommer: item.lidnommer,
          customPrice: item.customPrice,
        })),
        status: 'pending',
        softycomp: {
          userReference: userReference,
          billReference: result.reference, // Guid from SoftyComp
          shippingAddress: shippingAddress,
        }
      },
      req,
    })

    return {
      paymentURL: result.paymentURL,
      userReference: userReference,
      softyCompReference: result.reference,
      message: 'Payment initiated successfully',
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: 'SoftyComp Initiation Failed' })
    throw new APIError(error instanceof Error ? error.message : 'Payment initiation failed', 500)
  }
}
