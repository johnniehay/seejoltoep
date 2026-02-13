'use client'

import React, { useState } from 'react'
import { Button, toast, useModal, Modal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type { SyncChange } from '../types'
import { invalidateSASCache } from "@/plugins/sas-import/actions";

const modalSlug = 'sas-import-modal'

export const ImportButton: React.FC<{ collectionSlug: string }> = ({ collectionSlug }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [changes, setChanges] = useState<SyncChange[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const { openModal, closeModal } = useModal()
  const router = useRouter()

  const analyzeImport = async () => {
    setIsLoading(true)
    try {
      const req = await fetch(`/api/sas-import/sync/${collectionSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze' }),
      })

      const res = await req.json()

      if (req.ok) {
        if (res.changes && res.changes.length > 0) {
          setChanges(res.changes)
          setColumns(res.defaultColumns || ['id'])
          setSelectedIndices(new Set(res.changes.map((c: any) => c.row))) // Select all by default
          openModal(modalSlug)
        } else {
          toast.success('No changes detected from SAS.')
        }
      } else {
        toast.error(res.error || 'Analysis failed')
      }
    } catch (error) {
      toast.error('An error occurred during analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const executeImport = async () => {
    setIsLoading(true)
    const selection = Array.from(selectedIndices)

    try {
      const req = await fetch(`/api/sas-import/sync/${collectionSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'execute', selection, forceRefreshAfter: true }),
      })

      const res = await req.json()

      if (req.ok) {
        toast.success(`Import Complete: Updated ${res.stats.updated}, Created ${res.stats.created}.`)
        closeModal(modalSlug)
        setChanges([])
        router.refresh()
      } else {
        toast.error(res.error || 'Import failed')
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
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const toggleSelection = (rowIndex: number) => {
    const newSet = new Set(selectedIndices)
    if (newSet.has(rowIndex)) newSet.delete(rowIndex)
    else newSet.add(rowIndex)
    setSelectedIndices(newSet)
  }

  const toggleAll = () => {
    if (selectedIndices.size === changes.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(changes.map(c => c.row!)))
    }
  }

  const closeModalAndCache = () => {
    closeModal(modalSlug);
    invalidateSASCache()
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
      }}
    >
      <Button onClick={analyzeImport} disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Import from SAS'}
      </Button>

      <Modal slug={modalSlug} className="sync-modal">
        <div style={{
          padding: '25px',
          maxWidth: '85%',
          backgroundColor: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          borderRadius: 'var(--border-radius-m)',
          boxShadow: 'var(--theme-shadow-lg)'
        }}>
          <h2>Review Import Changes</h2>
          <p>The following changes will be imported from SAS:</p>

          <div style={{ maxHeight: '96rem', overflowY: 'auto', margin: '1rem 0', border: '1px solid var(--theme-elevation-200)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--theme-elevation-150)' }}>
                  <th style={{ padding: '0.5rem', width: '2.5rem' }}>
                    <input
                      type="checkbox"
                      checked={changes.length > 0 && selectedIndices.size === changes.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ padding: '0.5rem'}}>Action</th>
                  {columns.map(col => (
                    <th key={col} style={{ padding: '0.5rem'}}>
                      {col}
                    </th>
                  ))}
                  <th style={{ padding: '0.5rem'}}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {changes.map(change => (
                  <tr key={change.row} style={{ borderBottom: '1px solid var(--theme-elevation-200)' }}>
                    <td style={{ padding: '0.5rem'}}>
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(change.row!)}
                        onChange={() => toggleSelection(change.row!)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem'}}>
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
                      <td key={col} style={{ padding: '0.5rem', background: isChanged ? 'rgba(255, 255, 0, 0.1)' : 'transparent' }}>
                        {formatValue(getCellValue(change.data, col))}
                      </td>
                    )})}
                    <td style={{ padding: '0.5rem', fontSize: '0.9em'}}>
                      {Object.entries(change.changes).map(([field, diff]) => (
                        <div key={field}>
                          <strong>{field}:</strong> {formatValue(diff.old)} &rarr;{' '}
                          {formatValue(diff.new)}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button buttonStyle="secondary" onClick={() => closeModalAndCache()}>
              Cancel
            </Button>
            <Button onClick={executeImport} disabled={selectedIndices.size === 0}>
              {`Import ${selectedIndices.size} Item(s)`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ImportButton
