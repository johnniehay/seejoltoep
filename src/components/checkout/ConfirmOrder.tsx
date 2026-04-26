'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export const ConfirmOrder: React.FC = () => {
  const { confirmOrder } = usePayments()
  const { cart, clearCart } = useCart()

  const searchParams = useSearchParams()
  const router = useRouter()
  // Ensure we only confirm the order once
  const isConfirming = useRef(false)

  useEffect(() => {
    if (!cart || !cart.items || cart.items?.length === 0) {
      // If the cart is already empty, we might have already confirmed
      // Or the user is refreshing the page. We should probably redirect to orders if we have an ID
      return
    }

    const method = searchParams.get('method') || 'stripe'
    const paymentIntentID = searchParams.get('payment_intent')
    const userReference = searchParams.get('userReference')
    const email = searchParams.get('email')

    // For SoftyComp, we initiated the payment and got back a PaymentURL.
    // After success, it redirects here with userReference.
    // The initiatePayment call in CheckoutPage should have cached the softyCompReference
    // but since we are in a new page load, we rely on what we can pass through or retrieve.

    // However, the ecommerce plugin's initiatePayment returns data to the client.
    // In CheckoutPage, we redirect to SoftyComp.
    // To make this robust, we should ideally have the softyCompReference here too.
    // If not, confirmOrder can fall back to userReference.

    const identifier = method === 'softycomp' ? userReference : paymentIntentID

    if (identifier) {
      if (!isConfirming.current) {
        isConfirming.current = true

        confirmOrder(method, {
          additionalData: {
            paymentIntentID: identifier,
            userReference: userReference,
            // We pass userReference as both for SoftyComp if we don't have the Guid here.
            // The adapter's confirmOrder will handle it.
          },
        }).then((result) => {
          if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
            const accessToken = 'accessToken' in result ? (result.accessToken as string) : ''
            const queryParams = new URLSearchParams()

            if (email) {
              queryParams.set('email', email)
            }
            if (accessToken) {
              queryParams.set('accessToken', accessToken)
            }

            const queryString = queryParams.toString()

            // Clear cart before redirecting
            clearCart()

            router.push(`/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`)
          }
        }).catch((err) => {
          console.error('Order confirmation failed', err)
          isConfirming.current = false
          // Redirect to checkout with error?
        })
      }
    } else {
      router.push('/')
    }
  }, [cart, confirmOrder, router, searchParams, clearCart])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      <h1 className="text-2xl">Besig om bestelling te bevesting</h1>
      <LoadingSpinner className="w-12 h-6" />
    </div>
  )
}
