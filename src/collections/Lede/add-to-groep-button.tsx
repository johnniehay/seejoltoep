'use client'

import { Button } from '@/components/ui/button'
import { useSelection, toast, Select } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import { addLedeToGroep, getGroepe } from './add-to-groep-actions'

type Groep = {
  id: string
  naam: string
}

export const AddToGroepButton: React.FC = () => {
  const { selected, count: selectedcount} = useSelection()
  const [groepe, setGroepe] = useState<Groep[]>([])
  const [selectedGroep, setSelectedGroep] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchGroepe = async () => {
      try {
        const fetchedGroepe = await getGroepe()
        setGroepe(fetchedGroepe)
      } catch (error) {
        console.error('Failed to fetch groepe:', error)
        toast.error('Kon nie groepe laai nie.')
      }
    }
    fetchGroepe()
  }, [])

  const handleAddToGroep = async () => {
    if (selectedcount > 0 && selectedGroep) {
      setIsLoading(true)
      try {
        await addLedeToGroep(Array.from(selected).filter(([k,v]) => v && typeof k === 'string').map(([key, value]) => key as string), selectedGroep)
        toast.success(`${selectedcount} lede suksesvol bygevoeg by groep.`)
      } catch (error) {
        console.error('Failed to add lede to groep:', error)
        toast.error('Kon nie lede by groep voeg nie.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const groepOptions = groepe.map((t) => ({ label: t.naam, value: t.id }))

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <Select
        options={groepOptions}
        value={groepOptions.find((t) => t.value === selectedGroep)}
        onChange={(val) => setSelectedGroep((val as { value: string })?.value || '')}
      />
      <Button onClick={handleAddToGroep} disabled={selectedcount === 0 || !selectedGroep || isLoading}>
        {isLoading ? 'Besig...' : `Voeg ${selectedcount > 0 ? selectedcount : ''} by Groep`}
      </Button>
    </div>
  )
}
