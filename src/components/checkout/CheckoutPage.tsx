'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useState } from 'react'

import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import type { Address, Cart, Product } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const defaultCampAddress: Partial<Address> = {
  company: 'Seejol Voortrekkerkamp',
  addressLine1: 'Georgeweg 1',
  city: 'Mosselbaai',
  postalCode: '6506',
  state: 'Wes-Kaap',
  country: 'ZA',
}

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart: ucart } = useCart()
  const [error, setError] = useState<null | string>(null)
  const { theme } = useTheme()
  const cart = ucart as Cart
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>(defaultCampAddress) // Default to camp address
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>(defaultCampAddress) // Default to camp address
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(defaultCampAddress)
      setBillingAddress(defaultCampAddress)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      setProcessingPayment(true)
      try {
        const data = (await initiatePayment(paymentID, {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
          },
        })) as Record<string, unknown>

        if (data) {
          setPaymentData(data)
          if (paymentID === 'softycomp' && typeof data.paymentURL === 'string') {
            // Store the SoftyComp Reference in sessionStorage so we can use it in ConfirmOrder
            // This is more robust than just relying on the userReference from the URL
            if (data.softyCompReference) {
              sessionStorage.setItem('softyCompReference', data.softyCompReference as string)
            }
            window.location.href = data.paymentURL
          }
        }
      } catch (error) {
        setProcessingPayment(false)
        // const errorData = error instanceof Error ? error.message : {}
        let errorMessage = 'An error occurred while initiating payment:' + (error instanceof Error) ? (error as Error).message : "?"

        // if (errorData?.cause?.code === 'OutOfStock') {
        //   errorMessage = 'One or more items in your cart are out of stock.'
        // }

        setError(errorMessage)
        toast.error(errorMessage)
      }
    },
    [billingAddress, billingAddressSameAsShipping, shippingAddress, email, initiatePayment],
  )

  if (isProcessingPayment) {
    return (
      <div className="py-24 w-full flex flex-col items-center justify-center gap-6">
        <div className="prose dark:prose-invert text-center max-w-none">
          <h2 className="text-2xl font-medium">Besig om u betaling te verwerk...</h2>
          <p>U word nou herlei na die veilige betalingsportaal.</p>
        </div>
        <LoadingSpinner className="w-12 h-12" />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>U mandjie is leeg.</p>
        <Link href="/shop">Gaan voort met inkopies?</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <h2 className="font-medium text-3xl">Kontak</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/signin">Meld aan</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">of</span>
                <Link href="/create-account">skep \'n rekening</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Nie jy nie?{' '}
                <Link className="underline" href="/logout">
                  Meld af
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">Voer u e-posadres in om as gas uit te teken.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">E-posadres</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
                variant="default"
              >
                Gaan voort as gas
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-3xl">Adres</h2>
        <div className="bg-accent dark:bg-black rounded-lg p-4 ">
          <p className="prose dark:prose-invert">
            Alle produkte word by die kamp uitgedeel. Geen aflewering opsies is tans beskikbaar.
          </p>
        </div>

        {/* Hidden Address UI */}
        {/*
        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  disabled={Boolean(paymentData)}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  Verwyder
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses heading="Faktuuradres" setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={Boolean(paymentData || (!user && (!email || Boolean(emailEditable))))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean)
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">Aflewering dieselfde as faktuur</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                      disabled={Boolean(paymentData)}
                      onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                    Verwyder
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
              heading="Afleweringsadres"
              description="Kies asseblief \'n afleweringsadres."
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}
        */}

        {!paymentData && (
          <div className="flex gap-4">
            <Button
              className="self-start"
              disabled={!canGoToPayment}
              onClick={(e) => {
                e.preventDefault()
                void initiatePaymentIntent('softycomp')
              }}
            >
              Betaal met Kaart (SoftyComp)
            </Button>
          </div>
        )}

        {error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              Probeer weer
            </Button>
          </div>
        )}
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
          <h2 className="text-3xl font-medium">U mandjie</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product: productu,
                product: { id, meta, title, gallery },
                quantity,
                variant,
                lidnommer,
                customPrice,
              } = item
              const product = productu as Product

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = customPrice || product?.priceInZAR // Use customPrice if available

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = customPrice || variant?.priceInZAR // Use customPrice if available

                const imageVariant = product.gallery?.find((item) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {((variant && typeof variant === 'object') || lidnommer) && ( // Display lidnommer if present
                        <p className="text-sm font-mono text-primary/50 tracking-widest">
                          {[
                            ...((typeof variant === 'object'? variant?.options : [])?.map((option) => (typeof option === 'object' ? option.label : null)) || []),
                            lidnommer ? `Lid: ${lidnommer}` : null,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && <Price amount={price} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />
          <div className="flex justify-between items-center gap-2">
            <span className="uppercase">Total</span>{' '}
            <Price className="text-3xl font-medium" amount={cart.subtotal || 0} />
          </div>
        </div>
      )}
    </div>
  )
}
