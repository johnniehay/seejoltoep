import { useState, useEffect, useCallback } from 'react';
import { db, OfflineScan } from '@/lib/dexiedb';

// Define the shape of the initial data more strictly
type InitialInklok = {
  lidId: string;
  lidName: string;
  tipe: 'in' | 'uit';
  scan_time: number;
};

export function useScanSync(
  presensieId: string,
  scanAction: (lidid: string, tipe: 'in' | 'uit', time: number) => Promise<{ success: boolean; msg: string }>,
  initialInklokke: InitialInklok[],
  onSyncComplete?: () => Promise<void> | void
) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [presensieScans, setPresensieScans] = useState<OfflineScan[]>([]);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count helper
  const updatePendingCount = useCallback(async () => {
    const scans = await db.scans.where({ presensieId }).toArray();
    // Sort by scan_time to ensure correct order of application
    scans.sort((a, b) => a.scan_time - b.scan_time);
    setPresensieScans(scans);
    const count = scans.filter(s => s.synced === 0).length;
    setPendingCount(count);
  }, [presensieId]);

  // Populate DB with initial server data and load into state
  useEffect(() => {
    const populateAndLoad = async () => {
      await db.transaction('rw', db.scans, async () => {
        console.log(`populateAndLoad start`)
        const numDeleted = await db.scans.where({ presensieId, synced: 1 }).delete()
        console.log(`populateAndLoad deleted synced ${numDeleted}`)
        for (const inklok of initialInklokke) {
          const existing = await db.scans.get({ presensieId, lidId: inklok.lidId });
          if (!existing) {
            await db.scans.add({
              presensieId,
              lidId: inklok.lidId,
              lidName: inklok.lidName,
              scan_time: inklok.scan_time,
              synced: 1, // Mark as synced as it comes from the server
              tipe: inklok.tipe
            });
          }
        }
      });
      await updatePendingCount();
    };
    populateAndLoad();
  }, [initialInklokke, presensieId, updatePendingCount]);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = await db.scans.where({ presensieId, synced: 0 }).toArray();

    if (pending.length > 0) {
      for (const scan of pending) {
        try {
          const res = await scanAction(scan.lidId, scan.tipe, scan.scan_time);
          if (res.success) {
               await db.scans.update(scan.id!, { synced: 1 });
          }
        } catch (e) {
          console.error("Sync failed for", scan.lidId, e);
        }
      }
      await updatePendingCount();
    }
    if (onSyncComplete) await onSyncComplete();
  }, [presensieId, scanAction, updatePendingCount, onSyncComplete]);

  // Auto-sync when coming online
  useEffect(() => { if (isOnline) sync(); }, [isOnline, sync]);

  const addScan = async (lidId: string, lidName: string, tipe: 'in' | 'uit'): Promise<{ success: boolean; msg: string }> => {
    // 1. Store Locally
    const newScanData: Omit<OfflineScan, 'id'> = {
      lidId,
      presensieId,
      scan_time: Date.now(),
      synced: 0,
      lidName,
      tipe
    };

    const id = await db.scans.add(newScanData);
    setPresensieScans(prev => [...prev, { ...newScanData, id: id as number }]);
    setPendingCount(prev => prev + 1);

    // 2. If online, try immediate execution to give real feedback
    if (navigator.onLine) {
      try {
        const res = await scanAction(lidId, tipe, newScanData.scan_time);
        if (res.success) {
          await db.scans.update(id, { synced: 1 });
          setPresensieScans(prev => prev.map(s => s.id === id ? { ...s, synced: 1 } : s));
          setPendingCount(prev => prev - 1);
        }
        return res;
      } catch (e) {
        console.error("Online scan failed, falling back to queue", e);
        // Fall through to return the offline success message
      }
    }

    return { success: true, msg: `Gestoor (Vanlyn): ${lidName}` };
  };

  return { addScan, pendingCount, isOnline, presensieScans };
}
