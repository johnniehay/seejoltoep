'use client'
import type { Product, Variant } from '@/payload-types'

import RichText from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense, useState, useMemo, useEffect } from 'react'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { StockIndicator } from '@/components/product/StockIndicator'
import { useAuth } from '@/providers/Auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProductDescription({ product }: { product: Product }) {
  const { currency } = useCurrency()
  const { user } = useAuth()
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  const [lidnommer, setLidnommer] = useState<string>('')
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined)
  const [isFocused, setIsFocused] = useState(false)

  const lidnommerOptions = useMemo(() => {
    const options: string[] = []
    if (user && user.self_lid) {
      const self_lid = typeof user.self_lid === 'string' ? user.self_lid : user.self_lid.id
      options.push(self_lid)
    }
    if (user && user.gekoppelde_lede && Array.isArray(user.gekoppelde_lede)) {
      user.gekoppelde_lede.forEach((member) => {
        if (typeof member === 'object') {
          options.push(member.id)
        } else if (typeof member === 'string') {
          options.push(member)
        }
      })
    }
    return Array.from(new Set(options)).sort()
  }, [user])

  useEffect(() => {
    if (product.customInputs?.lidnommer && user?.self_lid && !lidnommer) {
      const self_lid = typeof user.self_lid === 'string' ? user.self_lid : user.self_lid.id
      setLidnommer(self_lid)
    }
  }, [product.customInputs?.lidnommer, user?.self_lid, lidnommer])

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }
        return 0
      }) as Variant[]

    const lowestVariant = variantsOrderedByPrice[0][priceField]
    const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]
    if (
      variantsOrderedByPrice &&
      typeof lowestVariant === 'number' &&
      typeof highestVariant === 'number'
    ) {
      lowestAmount = lowestVariant
      highestAmount = highestVariant
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-medium">{product.title}</h1>
        <div className="uppercase font-mono">
          {hasVariants ? (
            <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
          ) : (
            <Price amount={amount} />
          )}
        </div>
      </div>
      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}
      <hr />
      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}

      {product.customInputs?.lidnommer && (
        <div className="flex flex-col gap-2 relative">
          <Label htmlFor="lidnommer">Lidnommer</Label>
          <Input
            id="lidnommer"
            value={lidnommer}
            onChange={(e) => setLidnommer(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow clicking an option
            autoComplete="off"
            placeholder="Tik lidnommer hier"
          />
          {isFocused && lidnommerOptions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-auto">
              {lidnommerOptions.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevent onBlur from triggering before selection
                    setLidnommer(option)
                    setIsFocused(false)
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {product.customInputs?.customPrice && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customPrice">Custom Price</Label>
          <Input
            type="number"
            id="customPrice"
            value={customPrice || ''}
            onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} lidnommer={lidnommer} customPrice={customPrice} />
        </Suspense>
      </div>
    </div>
  )
}
