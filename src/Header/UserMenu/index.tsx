'use client'

import React, { Suspense, useState } from 'react'

import { User as UserIcon, LogOut, Settings } from 'lucide-react'
import { SetupModal } from "@/components/SetupModal";
import { OpenCartButton } from "@/components/Cart/OpenCart";
import { Cart } from "@/components/Cart";

export const UserMenu: React.FC<{ userData: {
    id: string | null | undefined,
    name: string | null | undefined,
    email: string | null | undefined,
    image: string | null | undefined
  }, setupSlot: React.ReactNode, serverMenuItems: React.ReactNode }> = ({ userData, setupSlot, serverMenuItems }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  return (
  <div className="max-w-1/3 flex justify-end items-center gap-4">
    {userData.id && (
      <>
        <div className="flex justify-end md:w-1/3 gap-4">
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <span className="hidden min-[320px]:block text-sm font-medium">{userData.name}</span>
            {userData.image ? (
              <img src={userData.image} alt={userData.name || 'User'} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            )}

          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 min-w-48 w-max bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm font-semibold border-b border-gray-100 dark:border-gray-800">
                  {userData.name}
                </div>
                <button
                  onClick={() => {
                    setIsSetupOpen(true)
                    setIsUserMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Profiel Opstelling
                </button>
                {serverMenuItems}
                <button
                  onClick={() => {
                    // signOutAction?.()
                    setIsUserMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center gap-2 text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  Teken Uit
                </button>
              </div>
            </>
          )}
        </div>
        {isSetupOpen && (
          <SetupModal>
            {setupSlot}
          </SetupModal>
        )}
      </>
    )}
  </div>
)
}
