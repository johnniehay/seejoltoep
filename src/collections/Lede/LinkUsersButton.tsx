'use client'

import { useState } from 'react'
import { Button, toast } from '@payloadcms/ui' // Import toast
import { linkAllCandidateUsers } from '@/app/(frontend)/setup/actions' // Adjust path as needed

export function LinkUsersButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await linkAllCandidateUsers()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Something went wrong.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{marginTop: "2rem"}}>
      <Button
        onClick={handleClick}
        buttonStyle="primary"
        disabled={loading}
        margin={false}
      >
        {loading ? 'Linking...' : 'Link All Candidate Users'}
      </Button>
    </div>
  )
}
