'use client'

import { createContext, Dispatch, SetStateAction, useState } from "react";


export const subscribeContext = createContext<{
  subscription: PushSubscription | null,
  setSubscription: Dispatch<SetStateAction<PushSubscription | null>>
}>({
  subscription: null,
  setSubscription: () => {
  }
})

export const SubscribeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  return (
    <subscribeContext.Provider value={{ subscription, setSubscription }}>
      {children}
    </subscribeContext.Provider>)
}
