'use client'

import { useContext, useEffect, useState } from "react";
import { subscribeContext } from "@/providers/NotificationSubscriptionProvider";
// import { subscribeContext } from "@/components/client-shell";

export default function ServiceWorkerManager() {
  const [, setIsSupported] = useState(false)
  const { setSubscription } = useContext(subscribeContext)
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
      console.log('Service worker manager')
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  return (<></>)
}
