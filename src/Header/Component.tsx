import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { auth } from '@/auth'

import type { Header } from '@/payload-types'
import { SetupModal } from '@/components/SetupModal'
import SetupPage from "@/app/(frontend)/setup/page";
import { getRoleFromUser } from "@/lib/get-role";
import { OverrideRoleSelect } from "@/Header/UserMenu/OverrideRoleSelect";
import PushNotificationSettings from "@/components/push-notification-settings";

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const session = await auth()
  const user = session?.user

  const userRole = getRoleFromUser(session?.user)
  const showSetup = userRole === "default"
  const realRole = getRoleFromUser(session?.user,true)
  const userData = {id: user?.id, name: user?.name, email: user?.email, image: user?.image}

  return (
    <>
      <HeaderClient
        data={headerData}
        userData={userData}
        setupSlot={<SetupPage />}
        serverMenuItems={realRole === "admin" && <OverrideRoleSelect role={userRole} realRole={realRole}/>}
        notificationSettingsSlot={<PushNotificationSettings compact={true}/>}
      />
      {showSetup && <SetupModal>
        <SetupPage />
      </SetupModal>
      }
    </>
  )
}
