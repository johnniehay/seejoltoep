'use client'

import React, { useState, useMemo } from 'react'
import { Button, toast, useSelection, useListQuery, Select } from '@payloadcms/ui'
import { Where } from 'payload'
import { createMissingBeursies } from './create-beursies-action'
import { generateInvoiceTransactions } from './invoice-actions'
import { processEItemWalletTransactions } from './eitem-actions'
import { runSasPaymentClearanceAction } from './sas-payment-actions'
import { useRouter } from 'next/navigation'

type Action = {
  label: string;
  value: string;
  onAll?: boolean;
  handler: (params: { ids?: string[]; where?: Where }) => Promise<{ success: boolean; message: string }>;
}

export function LedeActionsButton() {
  const [executing, setExecuting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const router = useRouter()

  const { selected, count: selectedCount } = useSelection()
  const { query } = useListQuery() // This provides the `where` clause from the current list view

  const actions: Action[] = useMemo(() => [
    { label: 'Skep Ontbrekende Beursies', value: 'createBeursies', onAll: true, handler: createMissingBeursies },
    { label: 'Genereer Faktuur Transaksies', value: 'generateInvoices', onAll: true, handler: generateInvoiceTransactions },
    { label: 'Prosesseer eItem Betalings', value: 'processEItems', onAll: true, handler: processEItemWalletTransactions },
    { label: 'Vereffen SAS Betalings', value: 'clearSasPayments', onAll: true, handler: runSasPaymentClearanceAction },
    // Add more actions here in the future
  ], [])

  const handleExecute = async () => {
    if (!selectedAction || !selectedAction.handler) return

    setExecuting(true)

    // Prepare payload info
    const selectionIds = Array.from(selected)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id as string)

    const params = {
      ids: selectionIds,
      where: query?.where || undefined,
    }

    try {
      const result = await selectedAction.handler(params)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Kon nie die aksie uitvoer nie.')
    } finally {
      setExecuting(false)
    }
  }

  const actionOptions = actions.map(a => ({ label: a.label, value: a.value })) // Options for the Select component

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      marginLeft: '10px',
      zIndex: 10 // Ensure dropdown isn't clipped
    }}>
      <div style={{ width: '250px' }}>
        <Select
          options={actionOptions}
          value={actionOptions.find((t) => t.value === selectedAction?.value)}
          onChange={(val) => setSelectedAction(actions.find(a => a.value === (val as { value: string })?.value) || null)}
          placeholder="Kies 'n aksie..."
        />
      </div>
      <Button
        onClick={handleExecute}
        disabled={!selectedAction || executing}
      >
        {executing ? 'Besig...' : selectedCount > 0 ? `Voer uit op ${selectedCount}` : 'Voer uit op Filter'}
      </Button>
    </div>
  )
}
