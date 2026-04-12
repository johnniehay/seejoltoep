'use client'

import React, { useState } from 'react'
import { Button, toast, useModal, Modal } from '@payloadcms/ui'
import type { SyncChange } from '../types'

interface Props {
  collectionSlug: string
}

const modalSlug = 'google-sheets-local-changes-modal'

export const LocalChangesButton: React.FC<Props> = ({ collectionSlug }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [changes, setChanges] = useState<SyncChange[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const { openModal, closeModal } = useModal()

  const handleCheck = async () => {
    setIsLoading(true)
    try {
      const req = await fetch(`/api/google-sheets/local-changes/${collectionSlug}`)
      const res = await req.json()

      if (req.ok) {
        if (res.changes && res.changes.length > 0) {
          setChanges(res.changes)
          setColumns(res.defaultColumns || ['id'])
          openModal(modalSlug)
        } else {
          toast.success('No local changes detected.')
        }
      } else {
        toast.error(res.error || 'Failed to check changes')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
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

  return (
    <div>
      <Button
        onClick={handleCheck}
        disabled={isLoading}
        buttonStyle="secondary"
      >
        {isLoading ? 'Checking...' : 'View Local Changes'}
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
          <h2>Local Changes (Unsynced)</h2>
          <p>The following fields have changed locally since the last sync:</p>

          <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '20px 0', border: '1px solid var(--theme-elevation-200)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
              <tr style={{ textAlign: 'left', background: 'var(--theme-elevation-150)' }}>
                <th style={{ padding: '8px' }}>Action</th>
                {columns.map(col => <th key={col} style={{ padding: '8px' }}>{col}</th>)}
                <th style={{ padding: '8px' }}>Changes</th>
              </tr>
              </thead>
              <tbody>
              {changes.map((change, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--theme-elevation-200)' }}>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: change.action === 'create' ? '#e6fffa' : '#ebf8ff',
                          color: change.action === 'create' ? '#2c7a7b' : '#2b6cb0',
                          width: 'fit-content'
                        }}>
                          {change.action === 'create' ? 'NEW' : 'MODIFIED'}
                        </span>
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
            <Button buttonStyle="secondary" onClick={() => closeModal(modalSlug)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
