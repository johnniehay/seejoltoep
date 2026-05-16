'use client';

import React, { useCallback } from "react";
import { format, isToday, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Kennisgewing } from '@/payload-types';
import RichText from "@/components/RichText";
import { hasText } from "@payloadcms/richtext-lexical/shared";
import { useOnInView } from "react-intersection-observer";
import { useKennisgewinglogs } from "@/providers/KennisgewingProvider";

const BODY_TRUNCATE_LIMIT = 25;

interface KennisgewingCardProps {
  notice: Kennisgewing;
}

export function KennisgewingCard({ notice }: KennisgewingCardProps) {
  const { kennisgewinglogs, refreshKennisgewinglogs } = useKennisgewinglogs()
  const noticeLog = kennisgewinglogs?.find((logentry) => typeof logentry.kennisgewing !== 'string' && logentry.kennisgewing.id === notice.id )
  const noticeDate = notice.timestamp ? new Date(notice.timestamp) : parseISO(notice.updatedAt);
  const formattedDate = isToday(noticeDate) ? format(noticeDate, 'HH:mm') : format(noticeDate, 'd MMM HH:mm');

  // Check if detail field has content (assuming it's an object if not empty)
  const hasDetailContent = hasText(notice.detail);
  const shouldTruncateBody = notice.body && notice.body.length > BODY_TRUNCATE_LIMIT;

  const shouldShowMore = shouldTruncateBody || hasDetailContent;
  const truncatedBody = shouldTruncateBody ? `${notice.body.substring(0, BODY_TRUNCATE_LIMIT)}...` : notice.body;
  //TODO: also show image and maybe actions in future

  // Helper function to update KennisgewingLog
  const updateKennisgewingLogStatus = useCallback(async (updateData: Record<string, any>)=> {
    try {
      const response = await fetch(`/api/kennisgewingLogs/${notice.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update KennisgewingLog:', errorData);
        // Optionally throw an error or handle it more gracefully
      } else {
        // console.log('KennisgewingLog updated successfully:', await response.json());
      }
    } catch (error) {
      console.error('Error sending update request to KennisgewingLog endpoint:', error);
    }
    await refreshKennisgewinglogs()
  },[notice.id, refreshKennisgewinglogs])

  const setViewDetails = useCallback(async () => await updateKennisgewingLogStatus({ viewed_details: true }),[updateKennisgewingLogStatus])

  const setAcknowledged= useCallback(async ( checked: boolean )=> await updateKennisgewingLogStatus({ acknowledged: checked }),[updateKennisgewingLogStatus])

  const setShown = useCallback(async () => await updateKennisgewingLogStatus ({ shown: true }), [updateKennisgewingLogStatus])



  const handleViewDetails = () => noticeLog?.viewed_details ? undefined : setViewDetails()
  const handleAcknowledgedChange =  (checked:boolean) => setAcknowledged(checked)
  const trackingRef = (noticeLog?.shown && false) ? undefined : useOnInView(
    (inView, entry) => {
      if (inView) {
        // Element is in view - perhaps log an impression
        console.log("Element appeared in view", entry.target);
        setShown()
        if (!notice.manual_confirmation&& !noticeLog?.acknowledged) {
          setAcknowledged(true)
        }
      }
    },
    {
      /* Optional options */
      threshold: 0.8,
      triggerOnce: true,
    },
  );

  return (
    <Dialog>
      <div ref={trackingRef} className="flex justify-between p-3 bg-background text-primary rounded-lg shadow-sm">
        {/* Left side: Title and Body */}
        <div className="flex flex-col flex-grow mr-4">
          <h3 className="text-lg font-semibold ">{notice.title}</h3>
          <div className="">
            <span>{shouldShowMore ? truncatedBody : notice.body}</span>
            {shouldShowMore && (
              <DialogTrigger asChild>
                <button
                  className="text-blue-600 hover:underline ml-1 inline-block"
                  onClick={handleViewDetails} // Add onClick handler
                >
                  Wys meer
                </button>
              </DialogTrigger>
            )}
          </div>
        </div>
        {/* Right side: Time and Checkbox */}
        <div className="flex flex-col items-end ml-4">
          <span className="text-sm font-semibold mt-2">{formattedDate}</span>
          <div className="flex-grow flex items-center justify-end mr-2">
            <Checkbox onCheckedChange={handleAcknowledgedChange} checked={noticeLog?.acknowledged ?? false}/> {/* Add onCheckedChange handler */}
          </div>
        </div>
      </div>
      <DialogContent className={"max-h-screen overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>{notice.title}</DialogTitle>
        </DialogHeader>
        <p className="">{notice.body}</p>
        {hasDetailContent && (
          <div className="p-2 bg-accent rounded">
            <h4 className="font-semibold">Detail:</h4>
            {hasDetailContent && notice.detail && <RichText data={notice.detail}/>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
