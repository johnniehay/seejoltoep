'use client'

import { useState, useEffect, ChangeEvent, useContext, useRef } from 'react'
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
  getSubscriptionTopics,
  setSubscriptionTopics
} from './push-subscribe-actions'

import type { NotificationTopic, NotificationTopics } from "@/lib/types";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/utilities/ui"
import { subscribeContext } from "@/providers/NotificationSubscriptionProvider";
import isEqual  from "lodash/isEqual";
import { SelectInput } from "@payloadcms/ui";
// import "node_modules/@payloadcms/next/dist/prod/styles.css"
import "node_modules/@payloadcms/ui/dist/styles.css"
import "./push-notification-settings-client.css"
import { Option } from "@payloadcms/ui/elements/ReactSelect";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const topicDefinitions = [
  { id: 'nood', label: 'Nood', description: 'Kritieke waarskuwings' },
  { id: 'nood:divisie', label: 'Nood: Divisie', description: 'Nood waarskuwings vir jou divisie' },
  { id: 'aktiwiteit-updates', label: 'Aktiwiteit Inligting Opdaterings', description: '' },
  { id: 'aktiwiteit-broadcast', label: 'Aktiwiteit Uitsendings', description: '' },
  { id: 'groep', label: 'Groep Kennisgewings', description: '' },
  { id: 'divisie', label: 'Divisie Kennisgewings', description: 'Divisie spesifieke boodskappe en herinneringe vir Robot Rondtes of Beoordeling' },
  { id: 'offisier', label: 'Offisier Kennisgewings', description: '' },
  { id: 'kamp', label: 'Kamp Kennisgewings', description: '' },
  { id: 'kamp:inligting', label: 'Kamp Inligting', description: 'Algemene kamp inligting' },
] as const;

const selectInputOptions = [
  ...topicDefinitions.map(def => ({ label: def.id, value: def.id })),
  { label: 'test', value: 'test' },
  { label: 'all', value: 'all' },
];

export default function PushNotificationSettingsClient({ visibleTopics, vapidPublicKey, compact = false }: { visibleTopics: NotificationTopics, vapidPublicKey:string, compact?: boolean }) {
  const [isSupported, setIsSupported] = useState(false)
  const { subscription, setSubscription } = useContext(subscribeContext)
  const [message, setMessage] = useState('')
  const [topics, setTopics] = useState<NotificationTopics>([])
  const lastTopics = useRef<NotificationTopics>([])
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen(o => !o)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      console.log('Push notification manager')
    }
  }, [])

  useEffect(() => {
    if (!subscription) {
      console.log('subscription null when trying to fetch topics')
    } else {
      const serializedSub = JSON.parse(JSON.stringify(subscription))
      getSubscriptionTopics({ sub: serializedSub }).then((v) => {
        if (v && "validationErrors" in v) {
          console.error("Unable to load subscribed topics", v)
        } else if (v && v.data) {
          console.log('topics fetched', v.data)
          lastTopics.current = v.data
          setTopics(v.data)
        }
      })
    }
  }, [subscription]);

  useEffect(() => {
    const texec = Date.now()
    console.log('topics changed',texec, topics, lastTopics.current)
    if (!subscription) {
      console.log('topics changed but subscription null',texec)
      return
    }
    if (isEqual(topics,lastTopics.current)) {
      console.log('topics unchanged, skipping update',texec)
      return
    }
    const serializedSub = JSON.parse(JSON.stringify(subscription))
    setSubscriptionTopics({ sub: serializedSub, topics }).then((acres) => {
      const setres = acres?.data
      if (setres) {
        if ("validationErrors" in setres) {
          console.error("Unable to set subscribed topics",texec, setres)
        } else {
          if ("failed" in setres) {
            console.log('subscribed topics update failed', setres)
            // subscribeUser(serializedSub).then(r => {})
          } else if ("success" in setres) {
            console.log('subscribed topics updated',texec, setres)
            lastTopics.current = setres.success
          }
        }
      }
    })
  }, [topics]);

  async function subscribeToPush(subscribetopics?: NotificationTopics) {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser({ sub: serializedSub, topics: subscribetopics ?? topics })
  }

  async function unsubscribeFromPush() {
    setSubscription(null)
    const serializedSub = JSON.parse(JSON.stringify(subscription))
    await unsubscribeUser({ sub: serializedSub })
    await subscription?.unsubscribe()
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification({ message })
      setMessage('')
    }
  }

  // Not used directly in new UI but kept for logic reference if needed
  async function handleOnChangeSubscribed(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.checked) {
      await subscribeToPush()
    } else {
      await unsubscribeFromPush()
    }
  }

  async function handleOnChangeSubscribeAll(value: string) {
    if (value === "all") {
      if (!subscription) {
        await subscribeToPush(visibleTopics)
      }
      setTopics(visibleTopics)
    }
    if (value === "off") {
      if (topics.length > 0) {
        setTopics([])
      }
      await unsubscribeFromPush()
    }
  }

  function handleOnChangeSubscribedSwitch(changetopic:NotificationTopic) {
    return async (checked: boolean) => {
      if (checked) {
        const newTopics = [...topics,changetopic]
        if (!subscription) {
          await subscribeToPush( newTopics )
        }
        setTopics(newTopics)
      } else {
        setTopics(topics.filter((topic) => topic !== changetopic && topic !== "all"))
      }
    }
  }

  const subscriptionSwitchvalue = !subscription ? "off" : (topics.includes("all") ? "all" : "some")

  const options = [
    {value:"off",label:"Af"},
    subscriptionSwitchvalue === "some" ? {value:"some",label:"Sommige",disabled:true} : null,
    {value:"all",label:"Alle"}
  ].filter((v): v is {value: string, label: string, disabled?: boolean} => !!v)

  if (!isSupported) {
    return <p>Kennisgewings word nie ondersteun in hierdie webblaaier nie.</p>
  }

  return (
    <Card className={"flex-grow"}>
      {!compact && <CardHeader>
        <CardTitle>Kennisgewings (aanbeveel)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Kennisgewings (Notifications) help ons om jou in kennis te stel van nuwe inhoud of uitstaande aksies wat van jou benodig word.
        </p>
      </CardHeader>}
      <CardContent className={compact ? "p-0" : "space-y-6"}>
        <div className={cn("flex space-y-4 flex-row items-center justify-between gap-2", compact && "space-y-0")}>
          <div className={compact ? "hidden" : "space-y-1"}>
            <Label className="text-base">Kennisgewings (Notifications)</Label>
            <p className="text-sm text-muted-foreground">
              {subscription ? "Jy is ingeteken vir kennisgewings." : "Jy is nie ingeteken vir kennisgewings nie. Ons beveel sterk aan dat jy inteken vir Alle kennisgewings hieronder"}
            </p>
          </div>

          <div className="flex items-center space-x-1 rounded-md border bg-muted p-1 flex-grow">
            {options.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => handleOnChangeSubscribeAll(option.value)}
                disabled={option.disabled}
                className={cn(
                  "h-8 px-3 text-sm font-medium flex-grow",
                  subscriptionSwitchvalue !== option.value && "text-muted-foreground hover:text-foreground",
                  subscriptionSwitchvalue === option.value && option.value !== "off" && option.value !== "all" && "bg-background shadow-sm text-foreground hover:bg-background",
                  subscriptionSwitchvalue === option.value && option.value === "off" && "bg-red-500 text-white shadow-sm hover:bg-red-600",
                  subscriptionSwitchvalue === option.value && option.value === "all" && "bg-green-500 text-white shadow-sm hover:bg-green-600"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {/*{ compact && <Button variant="ghost" size="icon" className={"h-6 w-4"} onClick={toggle}><GearIcon className=""}/></Button> }*/}
        </div>
        { !compact && <Button variant="ghost" size="icon" className={cn("h-6 rounded-full p-0 w-full",compact && 'h-3 rounded-none')} onClick={toggle}>
        <div className={compact ? "relative w-full" : "relative w-full py-2"}>
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
               <ChevronDown className={cn("h-4 w-7 transition-transform bg-card rounded-full",compact && 'h-3 w-5 ', open && "rotate-180")} />
          </div>
        </div>
        </Button>}

        {open && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {topicDefinitions.map((def) => {
              if (visibleTopics.includes(def.id as NotificationTopic)) {
                return (
                  <div key={def.id} className="flex items-center justify-between space-x-2">
                    <Label htmlFor={`topic-${def.id}`} className="flex flex-col space-y-1">
                      <span>{def.label}</span>
                      {def.description && <span className="font-normal text-xs text-muted-foreground">{def.description}</span>}
                    </Label>
                    <Switch
                      id={`topic-${def.id}`}
                      checked={topics.includes(def.id as NotificationTopic)}
                      onCheckedChange={handleOnChangeSubscribedSwitch(def.id as NotificationTopic)}
                    />
                  </div>
                )
              }
              return null
            })}

            {visibleTopics.includes("test") && (
              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="topic-test">Toets Kennisgewings</Label>
                  <Switch
                    id="topic-test"
                    checked={topics.includes("test")}
                    onCheckedChange={handleOnChangeSubscribedSwitch("test")}
                  />
                </div>

                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Tik kennisgewing boodskap"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button onClick={sendTestNotification}>Stuur Toets</Button>
                </div>

                <div className="space-y-2">
                  <Label>Ingetekende Onderwerpe (Dev)</Label>
                  <SelectInput
                    hasMany
                    options={selectInputOptions}
                    value={topics}
                    onChange={(selectedTopics) => setTopics((selectedTopics as Option<string>[]).map(({ value }) => value as NotificationTopic))}
                    path="topics"
                    name="topics"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
