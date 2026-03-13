'use client'

import React, { useEffect, useState } from 'react'
import { useField, toast, Select } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { getGroepeOptions, getLedeForGroep } from './add-groep-lede-actions'

export const AddGroepLedeButton: React.FC = () => {
  const { value, setValue } = useField<string[] | { id: string }[]>({ path: 'verwagte_lede' })
  const [groepe, setGroepe] = useState<{ label: string; value: string }[]>([])
  const [selectedGroep, setSelectedGroep] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadGroepe = async () => {
      try {
        const options = await getGroepeOptions()
        setGroepe(options)
      } catch (e) {
        console.error('Failed to load groepe', e)
      }
    }
    loadGroepe()
  }, [])

  const handleAdd = async () => {
    if (!selectedGroep) return

    setIsLoading(true)
    try {
      const ledeIds = await getLedeForGroep(selectedGroep)

      if (ledeIds.length === 0) {
        toast.error('Geen lede in hierdie groep gevind nie.')
        return
      }

      const currentIds = Array.isArray(value)
        ? value.map(v => (typeof v === 'string' ? v : v.id))
        : []

      // Merge and deduplicate
      const newSet = new Set([...currentIds, ...ledeIds])
      const newIds = Array.from(newSet)

      setValue(newIds)

      toast.success(`${ledeIds.length} lede bygevoeg.`)
      setSelectedGroep('')
    } catch (e) {
      console.error(e)
      toast.error('Kon nie lede byvoeg nie.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-[250px]">
        <Select
          options={groepe}
          value={groepe.find((t) => t.value === selectedGroep)}
          onChange={(val) => setSelectedGroep((val as { value: string })?.value || '')}
        />
      </div>
      <Button onClick={handleAdd} disabled={!selectedGroep || isLoading} type="button" variant="secondary">
        {isLoading ? 'Besig...' : 'Voeg Groep Lede By'}
      </Button>
    </div>
  )
}
