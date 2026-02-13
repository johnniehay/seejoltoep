'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { submitSetup } from './actions'
import { SetupSchema } from './schema'
import { signIn } from 'next-auth/webauthn'
import { User } from "@/payload-types";

type SetupFormData = z.infer<typeof SetupSchema>

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null
  return <p className="text-sm text-destructive mt-1">{error.message}</p>
}

const formatDate = (date?: string | null) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

function StatusIndicator({ status }: { status?: string }) {
  if (!status) return null

  let color = "bg-gray-100 text-gray-800"
  if (status === "Ongestoor") color = "bg-yellow-100 text-yellow-800"
  if (status === "Gekoppel") color = "bg-green-100 text-green-800"
  if (status === "Verkeerde geboortedatum") color = "bg-red-100 text-red-800"
  if (status.startsWith("Onbekende")) color = "bg-red-100 text-red-800"

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
      {status}
    </span>
  )
}

type ExtendedUser = Pick<User, "tipe" | "self_lid" | "gekoppelde_lede" | "candidate_self_lid_nommer" | "candidate_self_lid_dob" | "candidate_gekoppelde_lede"> & {
  candidate_self_lid_invalid_dob?: boolean
}

export function SetupForm({ user }: { user: ExtendedUser }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Helper to merge linked and candidate members for the form
  const getInitialChildren = useCallback(() => {
    const linked = Array.isArray(user.gekoppelde_lede)
      ? user.gekoppelde_lede.map((l: any) => ({
          lid_nommer: typeof l === 'string' ? l : l.id,
          dob: typeof l === 'string' ? '' : formatDate(l.geboortedatum),
          status: 'Gekoppel'
        }))
      : []

    const candidates = user.candidate_gekoppelde_lede?.length
      ? user.candidate_gekoppelde_lede.map((c: any) => ({
          lid_nommer: c.lid_nommer || '',
          dob: formatDate(c.dob),
          status: c.invalid_dob ? 'Verkeerde geboortedatum' : 'Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie.'
        }))
      : []

    return [...linked, ...candidates]
  }, [user])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, dirtyFields }
  } = useForm<SetupFormData>({
    resolver: zodResolver(SetupSchema),
    defaultValues: {
      tipe: (user.tipe as any) || 'Verkenner',
      self_lid_nommer: (typeof user.self_lid === 'string' ? user.self_lid : user.self_lid?.id ) || user.candidate_self_lid_nommer || '',
      self_lid_dob: formatDate((typeof user.self_lid !== 'string' && user.self_lid?.geboortedatum ) || user.candidate_self_lid_dob),
      hasYouth: (user.gekoppelde_lede?.length || user.candidate_gekoppelde_lede?.length || 0) > 0,
      isSelfMember: !!(user.candidate_self_lid_nommer || user.self_lid),
      children: getInitialChildren()
    }
  })

  useEffect(() => {
    reset({
      tipe: (user.tipe as any) || 'Verkenner',
      self_lid_nommer: (typeof user.self_lid === 'string' ? user.self_lid : user.self_lid?.id ) || user.candidate_self_lid_nommer || '',
      self_lid_dob: formatDate((typeof user.self_lid !== 'string' && user.self_lid?.geboortedatum ) || user.candidate_self_lid_dob),
      hasYouth: (user.gekoppelde_lede?.length || user.candidate_gekoppelde_lede?.length || 0) > 0,
      isSelfMember: !!(user.candidate_self_lid_nommer || user.self_lid),
      children: getInitialChildren()
    })
  }, [user, reset, getInitialChildren])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children"
  })

  const tipe = watch("tipe")
  const hasYouth = watch("hasYouth")
  const isSelfMember = watch("isSelfMember")

  const showSelfFields = tipe === 'Verkenner' || tipe === 'Offisier' || (tipe === 'Ouer' && isSelfMember)
  const showChildrenFields = (tipe === 'Offisier' && hasYouth) || tipe === 'Ouer'

  // Determine status for Self Lid
  const getSelfStatus = () => {
    // @ts-ignore
    if (errors.self_lid_nommer || errors.self_lid_dob) return null // Don't show status if validation error exists? Or show alongside.
    const isDirty = dirtyFields.self_lid_nommer || dirtyFields.self_lid_dob
    if (isDirty) return "Ongestoor"

    if (user.self_lid) return "Gekoppel"
    if (user.candidate_self_lid_nommer) {
      return user.candidate_self_lid_invalid_dob ? "Verkeerde geboortedatum" : "Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie."
    }
    return null
  }

  const handleAddPasskey = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await signIn('webauthn', { action: 'register', redirect: false })
      alert('Sleutel suksesvol bygevoeg!')
    } catch (error) {
      console.error(error)
      alert('Kon nie sleutel byvoeg nie. Probeer weer.')
    }
  }

  const onSubmit = async (data: SetupFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    const result = await submitSetup(data)

    if (result.success) {
      setSuccessMessage(result.message || 'Sukses!')
    } else {
      setServerError(result.message || 'Iets het foutgegaan')
      if (result.errors) {
        Object.entries(result.errors).forEach(([key, msgs]) => {
          // @ts-ignore - Dynamic key mapping for server errors
          setError(key, { message: msgs[0] })
        })
      }
    }
  }

  const inputClasses = "w-full p-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
  const cardClasses = "p-4 border border-border rounded-md bg-muted/40 space-y-4"

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-lg shadow-md space-y-8 border border-border">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Stel Profiel Op</h1>
        <p className="text-muted-foreground">Voltooi asseblief u inligting om toegang te verkry.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gebruiker Tipe */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Gebruiker Tipe</label>
          <select
            {...register("tipe")}
            className={inputClasses}
          >
            <option value="Verkenner">Verkenner</option>
            <option value="Offisier">Offisier</option>
            <option value="Ouer">Ouer</option>
          </select>
          <FieldError error={errors.tipe} />
        </div>

        {/* Checkboxes based on Type */}
        {tipe === 'Offisier' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasYouth"
              checked={hasYouth || false}
              onCheckedChange={(c) => {
                setValue("hasYouth", c as boolean)
                // Clear children if unchecked
                if (!c) {
                  setValue("children", [])
                }
              }}
            />
            <label htmlFor="hasYouth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ek het Jeuglede wat saam met my gaan kamp?
            </label>
          </div>
        )}

        {tipe === 'Ouer' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isSelfMember"
              checked={isSelfMember || false}
              onCheckedChange={(c) => {
                setValue("isSelfMember", c as boolean)
                // Clear self lid fields if unchecked to prevent validation errors
                if (!c) {
                  setValue("self_lid_nommer", "")
                  setValue("self_lid_dob", "")
                }
              }}
            />
            <label htmlFor="isSelfMember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ek is self ook 'n lid van die Voortrekkers?
            </label>
          </div>
        )}

        {/* Self Lid Fields */}
        {showSelfFields && (
          <div className={cardClasses}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">My Besonderhede</h3>
              <StatusIndicator status={getSelfStatus() || undefined} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lidnommer</label>
                <input type="text" {...register("self_lid_nommer")} className={inputClasses} />
                <FieldError error={errors.self_lid_nommer} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Geboortedatum</label>
                <input type="date" {...register("self_lid_dob")} className={inputClasses} />
                <FieldError error={errors.self_lid_dob} />
              </div>
            </div>
          </div>
        )}

        {/* Children / Linked Members Fields */}
        {showChildrenFields && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Gekoppelde Lede</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ lid_nommer: '', dob: '' })}>
                + Voeg Lid By
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className={`${cardClasses} relative`}>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <StatusIndicator
                    status={
                      // @ts-ignore
                      (dirtyFields.children?.[index]?.lid_nommer || dirtyFields.children?.[index]?.dob)
                        ? "Ongestoor"
                        : field.status
                    }
                  />
                  <button type="button" onClick={() => remove(index)} className="text-destructive text-sm hover:underline">
                    Verwyder
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lidnommer</label>
                    <input type="text" {...register(`children.${index}.lid_nommer`)} className={inputClasses} />
                    <FieldError error={errors.children?.[index]?.lid_nommer} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Geboortedatum</label>
                    <input type="date" {...register(`children.${index}.dob`)} className={inputClasses} />
                    <FieldError error={errors.children?.[index]?.dob} />
                  </div>
                </div>
              </div>
            ))}
            {/* Global error for children array (e.g. min length) */}
            {/* @ts-ignore - accessing root error for children array */}
            <FieldError error={errors.children?.root} />
            {/* @ts-ignore - accessing custom error mapped from server */}
            <FieldError error={errors.children_count} />
          </div>
        )}

        {/* Passkey Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold mb-2">Sekuriteit</h3>
          <div className="flex items-center justify-between p-4 border border-border rounded-md bg-muted/40">
            <div>
              <p className="font-medium">Wagwoord-sleutels (Passkeys)</p>
              <p className="text-sm text-muted-foreground">Meld vinniger aan met jou toestel.</p>
            </div>
            <Button type="button" variant="secondary" onClick={handleAddPasskey}>
              Voeg Sleutel by
            </Button>
          </div>
        </div>

        {/* Notification Placeholder */}
        <div className="pt-4 border-t border-border opacity-50">
          <h3 className="font-semibold mb-2">Kennisgewings</h3>
          <div className="p-4 border rounded-md bg-muted/40 border-dashed border-border">
            <p className="text-center text-muted-foreground italic">Instellings binnekort beskikbaar</p>
          </div>
        </div>

        {serverError && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {successMessage}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Besig om te stoor...' : 'Stoor Profiel'}
        </Button>
      </form>
    </div>
  )
}
