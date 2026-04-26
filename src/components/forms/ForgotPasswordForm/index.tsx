'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
}

export const ForgotPasswordForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
      {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (response.ok) {
      setSuccess(true)
      setError('')
    } else {
      setError('Daar was \'n probleem om die e-pos te stuur. Probeer asseblief weer.')
    }
  }, [])

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Wagwoord Vergeet</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>
              {`Voer asseblief u e-posadres hieronder in. U sal \'n boodskap ontvang met instruksies oor hoe om u wagwoord te herskep.`}
            </p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />

            <FormItem className="mb-8">
              <Label htmlFor="email" className="mb-2">
                E-posadres
              </Label>
              <Input
                id="email"
                {...register('email', { required: 'Verskaf asseblief u e-posadres.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <Button type="submit" variant="default">
              Stuur Wagwoord
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Versoek gestuur</h1>
          <div className="prose dark:prose-invert">
            <p>Gaan u e-pos na vir \'n skakel om u wagwoord veilig te herskep.</p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
