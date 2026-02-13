'use client'

import React, { useState, useEffect } from 'react'
import { Button, toast, useModal, Modal, Select } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type { SyncChange, GoogleSheetsSyncTarget } from '../types'

interface Props {
  collectionSlug: string
}

const modalSlug = 'google-sheets-sync-modal'

export const SyncButton: React.FC<Props> = ({ collectionSlug }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [changes, setChanges] = useState<SyncChange[]>([])
  const [direction, setDirection] = useState<'export' | 'import'>('export')
  const [columns, setColumns] = useState<string[]>([])
  const [targets, setTargets] = useState<GoogleSheetsSyncTarget[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const { openModal, closeModal } = useModal()
  const router = useRouter()

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const req = await fetch(`/api/google-sheets/targets/${collectionSlug}`)
        if (req.ok) {
          const res = await req.json()
          setTargets(res.targets || [])
          if (res.targets?.length > 0) {
            setSelectedTarget(res.targets[0].name)
          }
        }
      } catch (e) {
        console.error("Failed to fetch sync targets", e)
      }
    }
    fetchTargets()
  }, [collectionSlug])

  const analyzeSync = async (dir: 'export' | 'import') => {
    setIsLoading(true)
    setDirection(dir)
    try {
      const req = await fetch(`/api/google-sheets/sync/${collectionSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: dir, mode: 'analyze', target: selectedTarget }),
      })

      const res = await req.json()

      if (req.ok) {
        if (res.changes && res.changes.length > 0) {
          setChanges(res.changes)
          setColumns(res.defaultColumns || ['id'])
          setSelectedIndices(new Set(res.changes.map((_: any, i: number) => i)))
          openModal(modalSlug)
        } else {
          toast.success('No changes detected.')
        }
      } else {
        toast.error(res.error || 'Analysis failed')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeSync = async () => {
    setIsLoading(true)

    // Prepare selection payload
    const selection = Array.from(selectedIndices).map(i => {
      const change = changes[i]
      if (direction === 'export') {
        return change.id // Send ID for export
      } else {
        return change.row // Send Row Number for import
      }
    }).filter(Boolean)

    try {
      const req = await fetch(`/api/google-sheets/sync/${collectionSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, mode: 'execute', selection, target: selectedTarget }),
      })

      const res = await req.json()

      if (req.ok) {
        toast.success(`Sync Complete: Updated ${res.stats.updated} items, Created ${res.stats.created} items.`)
        closeModal(modalSlug)
        setChanges([])
        router.refresh()
      } else {
        toast.error(res.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Execution failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getCellValue = (row: any, col: string) => {
    if (!row) return ''
    return col.split('.').reduce((acc, part) => acc && acc[part], row) ?? ''
  }

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') {
      return JSON.stringify(val)
    }
    return String(val)
  }

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices)
    if (newSet.has(index)) newSet.delete(index)
    else newSet.add(index)
    setSelectedIndices(newSet)
  }

  const toggleAll = () => {
    if (selectedIndices.size === changes.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(changes.map((_, i) => i)))
    }
  }

  const targetOptions = targets.map((t) => ({ label: t.name, value: t.name }))

  return (
    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      {targets.length > 1 && (
        <div style={{ width: '200px' }}>
          <Select
            options={targetOptions}
            value={targetOptions.find((t) => t.value === selectedTarget)}
            onChange={(val) => setSelectedTarget((val as { value: string })?.value || '')}
          />
        </div>
      )}

      <Button
        onClick={() => analyzeSync('export')}
        disabled={isLoading}
        buttonStyle="secondary"
      >
        {isLoading ? 'Analyzing...' : 'Sync to Sheets'}
      </Button>
      <Button
        onClick={() => analyzeSync('import')}
        disabled={isLoading}
        buttonStyle="secondary"
      >
        {isLoading ? 'Analyzing...' : 'Sync from Sheets'}
      </Button>

      <Modal slug={modalSlug} className="sync-modal">
        <div style={{
          padding: '25px',
          maxWidth: '800px',
          backgroundColor: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          borderRadius: 'var(--border-radius-m)',
          boxShadow: 'var(--theme-shadow-lg)'
        }}>
          <h2>Review Changes ({direction === 'export' ? 'To Sheets' : 'From Sheets'})</h2>
          <p>The following changes will be applied:</p>

          <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '20px 0', border: '1px solid var(--theme-elevation-200)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--theme-elevation-150)' }}>
                  <th style={{ padding: '8px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={changes.length > 0 && selectedIndices.size === changes.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ padding: '8px' }}>Action</th>
                  {columns.map(col => <th key={col} style={{ padding: '8px' }}>{col}</th>)}
                  <th style={{ padding: '8px' }}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--theme-elevation-200)' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={() => toggleSelection(i)}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: change.action === 'create' ? '#e6fffa' : '#ebf8ff',
                          color: change.action === 'create' ? '#2c7a7b' : '#2b6cb0',
                          width: 'fit-content'
                        }}>
                          {change.action.toUpperCase()}
                        </span>
                        {change.row !== undefined && <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Row {change.row}</span>}
                      </div>
                    </td>
                    {columns.map(col => {
                      const isChanged = Object.keys(change.changes).includes(col)
                      return (
                        <td key={col} style={{
                          padding: '8px',
                          background: isChanged ? 'rgba(255, 255, 0, 0.1)' : 'transparent'
                        }}>
                          {formatValue(getCellValue(change.data, col))}
                        </td>
                      )
                    })}
                    <td style={{ padding: '8px', fontSize: '0.9em' }}>
                      {Object.entries(change.changes).map(([field, diff]) => (
                        <div key={field}>
                          <strong>{field}:</strong> {formatValue(diff.old)} &rarr; {formatValue(diff.new)}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button buttonStyle="secondary" onClick={() => closeModal(modalSlug)}>Cancel</Button>
            <Button onClick={executeSync} disabled={selectedIndices.size === 0}>
              {selectedIndices.size === 0
                ? 'Select rows to sync'
                : `Sync ${selectedIndices.size} Row${selectedIndices.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Default export for dynamic import usage in Payload config
export default SyncButton
