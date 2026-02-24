import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { auth } from '@/auth'

import type { Header } from '@/payload-types'
import { SetupModal } from '@/components/SetupModal'
import SetupPage from "@/app/(frontend)/setup/page";

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const session = await auth()
  const user = session?.user

  const showSetup = (user && (!user.role || user.role.length === 0))
  const userData = {name: user?.name, email: user?.email, image: user?.image}

  return (
    <>
      <HeaderClient data={headerData} userData={userData} setupSlot={<SetupPage />} />
      {showSetup && <SetupModal>
        <SetupPage />
      </SetupModal>
      }
    </>
  )
}
