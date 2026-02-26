import { useState, useEffect, useCallback } from 'react';
import { db, OfflineScan } from '@/lib/dexiedb';

// Define the shape of the initial data more strictly
type InitialInklok = {
  lidId: string;
  lidName: string;
};

export function useScanSync(
  presensieId: string,
  scanAction: (lidid: string) => Promise<{ success: boolean; msg: string }>,
  initialInklokke: InitialInklok[]
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
              timestamp: Date.now(),
              synced: 1, // Mark as synced as it comes from the server
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
    if (pending.length === 0) return;

    for (const scan of pending) {
      try {
        const res = await scanAction(scan.lidId);
        if (res.success) {
             await db.scans.update(scan.id!, { synced: 1 });
        }
      } catch (e) {
        console.error("Sync failed for", scan.lidId, e);
      }
    }
    await updatePendingCount();
  }, [presensieId, scanAction, updatePendingCount]);

  // Auto-sync when coming online
  useEffect(() => { if (isOnline) sync(); }, [isOnline, sync]);

  const addScan = async (lidId: string, lidName: string): Promise<{ success: boolean, msg: string }> => {
    // 1. Store Locally
    const newScanData: Omit<OfflineScan, 'id'> = {
      lidId,
      presensieId,
      timestamp: Date.now(),
      synced: 0,
      lidName
    };

    const id = await db.scans.add(newScanData);
    setPresensieScans(prev => [...prev, { ...newScanData, id: id as number }]);
    setPendingCount(prev => prev + 1);

    // 2. If online, try immediate execution to give real feedback
    if (navigator.onLine) {
      try {
        const res = await scanAction(lidId);
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
