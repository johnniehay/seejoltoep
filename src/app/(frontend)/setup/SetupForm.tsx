'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, Undo, HelpCircle } from 'lucide-react'
import { updateSettings, updateSelfLid, upsertChild, removeChild } from './actions'
import { SettingsSchema, LidFormSchema } from './schema'
import { signIn } from 'next-auth/webauthn'
import { User } from "@/payload-types";

type SettingsFormData = z.infer<typeof SettingsSchema>
type LidFormData = z.infer<typeof LidFormSchema>

export interface LidFormHandle {
  isDirty: boolean;
  save: () => Promise<void>;
}

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

type ExtendedUser = Pick<User, "tipe" | "self_lid" | "gekoppelde_lede" | "candidate_self_lid_nommer" | "candidate_self_lid_dob" | "candidate_self_lid_invalid_dob" | "candidate_gekoppelde_lede">

const inputClasses = "w-full p-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
const cardClasses = "p-4 border border-border rounded-md bg-muted/40 space-y-4"

const SelfLidForm = React.forwardRef<LidFormHandle, { user: ExtendedUser }>(({ user }, ref) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, dirtyFields } } = useForm<LidFormData>({
    resolver: zodResolver(LidFormSchema),
    defaultValues: {
      lid_nommer: (typeof user.self_lid === 'string' ? user.self_lid : user.self_lid?.id ) || user.candidate_self_lid_nommer || '',
      dob: formatDate((typeof user.self_lid !== 'string' && user.self_lid?.geboortedatum ) || user.candidate_self_lid_dob),
    }
  })

  useImperativeHandle(ref, () => ({
    isDirty: Object.keys(dirtyFields).length > 0,
    save: async () => {
      await handleSubmit(onSubmit)()
    }
  }))

  useEffect(() => {
    reset({
      lid_nommer: (typeof user.self_lid === 'string' ? user.self_lid : user.self_lid?.id ) || user.candidate_self_lid_nommer || '',
      dob: formatDate((typeof user.self_lid !== 'string' && user.self_lid?.geboortedatum ) || user.candidate_self_lid_dob),
    })
  }, [user, reset])

  const getStatus = () => {
    if (dirtyFields.lid_nommer || dirtyFields.dob) return "Ongestoor"
    if (user.self_lid) return "Gekoppel"
    if (user.candidate_self_lid_nommer) {
      return user.candidate_self_lid_invalid_dob ? "Verkeerde geboortedatum" : "Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie."
    }
    return null
  }

  const onSubmit = async (data: LidFormData) => {
    await updateSelfLid(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cardClasses}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold mb-2">My Besonderhede</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Lidnommer</label>
          <input type="text" {...register("lid_nommer")} className={inputClasses} />
          <FieldError error={errors.lid_nommer} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Geboortedatum</label>
          <input type="date" {...register("dob")} className={inputClasses} disabled={getStatus() === 'Gekoppel'} />
          <FieldError error={errors.dob} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border min-h-[3.5rem]">
        <div className="flex items-center gap-2">
          <StatusIndicator status={getStatus() || undefined} />
        </div>
        <div className="flex items-center gap-2">
          {(dirtyFields.lid_nommer || dirtyFields.dob) && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => reset()} title="Revert changes">
                <Undo className="h-4 w-4 mr-2" />
                <span>Kanselleer</span>
              </Button>
              <Button type="submit" variant="default" size="sm" title="Save changes" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                <span>Stoor</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  )
})
SelfLidForm.displayName = "SelfLidForm"

const ChildLidForm = React.forwardRef<LidFormHandle, {
  data: { lid_nommer: string, dob: string, status?: string, id?: string, type?: 'linked' | 'candidate', row_id?: string },
  onSave: (formData: LidFormData) => Promise<void>,
  onDelete: () => Promise<void>
}>(({ data, onSave, onDelete }, ref) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, dirtyFields } } = useForm<LidFormData>({
    resolver: zodResolver(LidFormSchema),
    defaultValues: {
      lid_nommer: data.lid_nommer,
      dob: data.dob
    }
  })

  useImperativeHandle(ref, () => ({
    isDirty: Object.keys(dirtyFields).length > 0,
    save: async () => {
      await handleSubmit(onSave)()
    }
  }))

  useEffect(() => {
    reset({
      lid_nommer: data.lid_nommer,
      dob: data.dob
    })
  }, [data, reset])

  const status = (dirtyFields.lid_nommer || dirtyFields.dob) ? "Ongestoor" : data.status

  return (
    <form onSubmit={handleSubmit(onSave)} className={cardClasses}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Lidnommer</label>
          <input type="text" {...register("lid_nommer")} className={inputClasses} />
          <FieldError error={errors.lid_nommer} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Geboortedatum</label>
          <input type="date" {...register("dob")} className={inputClasses} disabled={status === 'Gekoppel'} />
          <FieldError error={errors.dob} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border min-h-[3.5rem]">
        <div className="flex items-center gap-2">
          <StatusIndicator status={status} />
        </div>
        <div className="flex items-center gap-2">
          {(dirtyFields.lid_nommer || dirtyFields.dob) && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => reset()} title="Revert changes">
                <Undo className="h-4 w-4 mr-2" />
                <span>Kanselleer</span>
              </Button>
              <Button type="submit" variant="default" size="sm" title="Save changes" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                <span>Stoor</span>
              </Button>
            </>
          )}
          <button type="button" onClick={onDelete} className="text-destructive text-sm hover:underline ml-2">
            Verwyder
          </button>
        </div>
      </div>
    </form>
  )
})
ChildLidForm.displayName = "ChildLidForm"

export function SetupForm({ user, callbackUrl, pushSettings }: { user: ExtendedUser, callbackUrl?: string, pushSettings?: React.ReactNode }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [newChildren, setNewChildren] = useState<{id: string, lid_nommer: string, dob: string}[]>([])

  const selfLidRef = useRef<LidFormHandle>(null)
  const childRefs = useRef<Map<string, LidFormHandle>>(new Map())

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      tipe: (user.tipe as any) || 'Jeuglid',
      hasYouth: (user.gekoppelde_lede?.length || user.candidate_gekoppelde_lede?.length || 0) > 0,
      isSelfMember: !!(user.candidate_self_lid_nommer || user.self_lid),
    }
  })

  const tipe = watch("tipe")
  const isTipeLocked = !!user.tipe
  const hasYouth = watch("hasYouth")
  const isSelfMember = watch("isSelfMember")

  const childrenList = useMemo(() => {
    const linked = Array.isArray(user.gekoppelde_lede)
      ? user.gekoppelde_lede.map((l: any) => ({
          id: typeof l === 'string' ? l : l.id,
          type: 'linked' as const,
          lid_nommer: typeof l === 'string' ? l : l.id,
          dob: typeof l === 'string' ? '' : formatDate(l.geboortedatum),
          status: 'Gekoppel'
        }))
      : []

    const candidates = user.candidate_gekoppelde_lede?.length
      ? user.candidate_gekoppelde_lede.map((c: any) => ({
          id: c.row_id || c.id, // Use row_id if available, else fallback to id
          row_id: c.row_id,
          type: 'candidate' as const,
          lid_nommer: c.lid_nommer || '',
          dob: formatDate(c.dob),
          status: c.invalid_dob ? 'Verkeerde geboortedatum' : 'Onbekende lid nog nie hierdie jaar of voorheen ingeskry vir Seejol nie.'
        }))
      : []

    // Merge with new unsaved children
    const unsaved = newChildren.map(c => ({
      ...c, type: 'candidate' as const, status: 'Ongestoor'
    }))

    return [...linked, ...candidates, ...unsaved]
  }, [user, newChildren])

  const showSelfFields = tipe === 'Jeuglid' || tipe === 'Offisier' || (tipe === 'Ouer' && isSelfMember)
  const showChildrenFields = (tipe === 'Offisier' && hasYouth) || tipe === 'Ouer'

  const handleAddPasskey = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await signIn('passkey', { action: 'register', redirect: false })
      alert('Sleutel suksesvol bygevoeg!')
    } catch (error) {
      console.error(error)
      alert('Kon nie sleutel byvoeg nie. Probeer weer.')
    }
  }

  const onSettingsSubmit = async (data: SettingsFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    // Check for unsaved changes in sub-forms
    const dirtyChildRefs = Array.from(childRefs.current.values()).filter(r => r?.isDirty)
    const isSelfDirty = selfLidRef.current?.isDirty

    if (isSelfDirty || dirtyChildRefs.length > 0) {
      if (window.confirm("Daar is ongestoorde veranderinge in u lede besonderhede. Wil u dit eers stoor?")) {
        const promises = []
        if (isSelfDirty && selfLidRef.current) promises.push(selfLidRef.current.save())
        dirtyChildRefs.forEach(r => promises.push(r.save()))
        await Promise.all(promises)
      }
    }

    const result = await updateSettings(data)

    if (result.success) {
      setSuccessMessage(result.message || 'Sukses!')
      router.push(callbackUrl || '/')
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

  const handleSaveChild = async (data: LidFormData, original: any) => {
    const result = await upsertChild({
      ...data,
      row_id: original.row_id,
      original_id: original.id,
      original_type: original.type
    })
    if (result.success) {
      // If it was a new child, remove from local state as it will come back via props
      if (newChildren.some(nc => nc.id === original.id)) {
        setNewChildren(prev => prev.filter(nc => nc.id !== original.id))
      }
    }
  }

  const handleDeleteChild = async (child: any) => {
    if (newChildren.some(nc => nc.id === child.id)) {
      setNewChildren(prev => prev.filter(nc => nc.id !== child.id))
      return
    }
    await removeChild(child.id, child.type)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-lg shadow-md space-y-8 border border-border">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Stel Profiel Op</h1>
        <p className="text-muted-foreground">Voltooi asseblief u inligting om toegang te verkry.</p>
      </div>

      <div className="space-y-6">
        {/* Gebruiker Tipe */}
        <div className="space-y-2" onClick={isTipeLocked ? () => alert('Kontak seejol@voortrekkers.co.za om jou profiel tipe te verander.') : undefined}>
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium">Gebruiker Tipe</label>
            {isTipeLocked && (
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <select
            {...register("tipe")}
            disabled={isTipeLocked}
            className={`${inputClasses} ${isTipeLocked ? 'cursor-not-allowed' : ''}`}
          >
            <option value="Jeuglid">Jeuglid (Verkenner/PD)</option>
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
              }}
            />
            <label htmlFor="isSelfMember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ek is self ook 'n lid van die Voortrekkers?
            </label>
          </div>
        )}

        {/* Self Lid Fields */}
        {showSelfFields && <SelfLidForm user={user} ref={selfLidRef} />}

        {/* Children / Linked Members Fields */}
        {showChildrenFields && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Gekoppelde Lede</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setNewChildren(prev => [...prev, { id: crypto.randomUUID(), lid_nommer: '', dob: '' }])}>
                + Voeg Lid By
              </Button>
            </div>

            {childrenList.map((child) => (
              <ChildLidForm
                key={child.id}
                ref={(el) => { if (el) childRefs.current.set(child.id, el); else childRefs.current.delete(child.id); }}
                data={child}
                onSave={(data) => handleSaveChild(data, child)}
                onDelete={() => handleDeleteChild(child)}
              />
            ))}
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

        {/* Notification Settings */}
        {pushSettings}

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

        <Button onClick={handleSubmit(onSettingsSubmit)} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Besig om te stoor...' : 'Stoor Profiel'}
        </Button>
      </div>
    </div>
  )
}
