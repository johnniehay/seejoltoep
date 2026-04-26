'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendOrderAccessEmail } from './sendOrderAccessEmail'

type FormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await sendOrderAccessEmail({
        email: data.email,
        orderID: data.orderID,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setSubmitError(result.error || 'Iets het foutgegaan. Probeer asseblief weer.')
      }
    } catch {
      setSubmitError('Iets het foutgegaan. Probeer asseblief weer.')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  if (success) {
    return (
      <Fragment>
        <h1 className="text-xl mb-4">Gaan u e-pos na</h1>
        <div className="prose dark:prose-invert">
          <p>
            {`As 'n bestelling bestaan met die verskafde e-pos en bestelnommer, het ons vir u 'n e-pos gestuur met 'n skakel om u bestellingsbesonderhede te sien.`}
          </p>
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <h1 className="text-xl mb-4">Vind my bestelling</h1>
      <div className="prose dark:prose-invert mb-8">
        <p>{`Voer asseblief u e-posadres en bestelnommer hieronder in. Ons sal vir u 'n skakel stuur om u bestelling te sien.`}</p>
      </div>
      <form className="max-w-lg flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            E-posadres
          </Label>
          <Input
            id="email"
            {...register('email', { required: 'E-pos is verpligtend.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="orderID" className="mb-2">
            Bestelnommer
          </Label>
          <Input
            id="orderID"
            {...register('orderID', {
              required: 'Bestelnommer is verpligtend.',
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        {submitError && <FormError message={submitError} />}
        <Button type="submit" className="self-start" variant="default" disabled={isSubmitting}>
          {isSubmitting ? 'Besig om te stuur...' : 'Soek bestelling'}
        </Button>
      </form>
    </Fragment>
  )
}
