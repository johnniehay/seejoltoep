'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from "sonner";
interface PayButtonProps {
  productId: string
  amount: number
  lidId: string
}

export const PayButton: React.FC<PayButtonProps> = ({ productId, amount, lidId }) => {
  const { addItem } = useCart()

  const handlePay = () => {
    // Voeg produk by waentjie met pasgemaakte metadata soos gevra
    addItem({
      product: productId,
      lidnommer: lidId,
      customPrice: amount,
    } as Parameters<typeof addItem>[0], 1).then(() => {
        toast.success('Item by mandjie gevoeg.')
      })
  }

  return (
    <div className="mt-6 flex justify-center">
      <Button
        onClick={handlePay}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        Voeg Uitstaande Balans by Mandjie ({new Intl.NumberFormat('af-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)})
      </Button>
    </div>
  )
}
