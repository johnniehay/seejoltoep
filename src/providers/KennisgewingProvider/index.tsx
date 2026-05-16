'use client'

import { createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KennisgewingLog } from "@/payload-types";
import { useAuth } from "@/providers/Auth";
import { formatAdminURL } from "payload/shared";
import * as qs from 'qs-esm'


export const kennisgewingLogContext = createContext<{
  kennisgewinglogs: KennisgewingLog[] | null,
  setKennisgewinglogs: Dispatch<SetStateAction<KennisgewingLog[] | null>>,
  refreshKennisgewinglogs: () => Promise<void>
}>({
  kennisgewinglogs: null,
  setKennisgewinglogs: () => { },
  refreshKennisgewinglogs: async () => { }
})

const baseAPIURL = formatAdminURL({ apiRoute: '/api', path: '' })

export const KennisgewingLogContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [kennisgewinglogs, setKennisgewinglogs] = useState<KennisgewingLog[] | null>(null)
  const { user } = useAuth()

  const kennisgewinglogQuery = useMemo(() => {
    return {
      where: {
        and: [
          {
            "kennisgewing._status": {
              equals: 'published',
            }
          },
          {
            'user.id': {
              equals: user?.id ?? "non-logged-in-user"
            }
          }
        ]
      },
      depth: 1,
      select: {
        user: false,
      },
    }
  }, [user])

  const getKennisgewingLogs = useCallback(
    async () => {
      const query = qs.stringify(kennisgewinglogQuery)

      const response = await fetch(`${baseAPIURL}/kennisgewingLogs?${query}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch kennisgewingLogs: ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`KennisgewingLogs fetch error: ${data.error}`)
      }

      return data.docs as KennisgewingLog[]
    },
    [kennisgewinglogQuery],
  )

  const refreshKennisgewinglogs = useCallback(async () => {
    console.log(`kennisgewing refreshKennisgewinglogs ${user?.id ?? "non-logged-in-user"}`)
    if (!user) {
      return
    }
    const updatedKennisgewingLogs = await getKennisgewingLogs()
    setKennisgewinglogs(updatedKennisgewingLogs);
  }, [getKennisgewingLogs,user])

  useEffect(() => {
    // Set up polling interval (every 5 seconds)
    console.log("kennisgewing setInterval set")
    refreshKennisgewinglogs().then()

    const intervalId = setInterval(refreshKennisgewinglogs, 300000); //TODO: increased to 5 min, make use-ers refresh but with debounce

    // Cleanup: Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [refreshKennisgewinglogs]);



  return (
    <kennisgewingLogContext.Provider value={{ kennisgewinglogs, setKennisgewinglogs, refreshKennisgewinglogs }}>
      {children}
    </kennisgewingLogContext.Provider>)
}
export const useKennisgewinglogs = () => useContext(kennisgewingLogContext);
