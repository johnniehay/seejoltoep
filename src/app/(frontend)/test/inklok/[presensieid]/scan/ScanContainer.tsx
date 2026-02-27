'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Lede } from '@/payload-types';
import { QRScannerModalProvider } from '@/components/QRScanner';
import ScanListener from './ScanListener';
import { useScanSync } from '@/hooks/useScanSync';
import { IconCloudUpload } from '@tabler/icons-react';

interface ScanContainerProps {
  presensieId: string;
  presensieNaam: string;
  initialInklokke: { id: string; lid: { id: string; naam?: string | null } }[];
  expectedLede: Record<string, Lede>;
  scanAction: (lidid: string) => Promise<{ success: boolean; msg: string }>;
  fetchDataAction: (id: string) => Promise<{
      presensieNaam: string | null | undefined;
      expectedLede: Record<string, Lede>;
      initialInklokke: { id: string; lid: { id: string; naam?: string | null } }[];
  } | null>;
}

export default function ScanContainer({
  presensieId,
  presensieNaam,
  initialInklokke,
  expectedLede,
  scanAction,
  fetchDataAction,
}: ScanContainerProps) {
  const [serverInklokke, setServerInklokke] = useState(initialInklokke);
  const [expectedLedeState, setExpectedLedeState] = useState(expectedLede);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!navigator.onLine) return;
      try {
        const data = await fetchDataAction(presensieId);
        if (data) {
          setServerInklokke(data.initialInklokke);
          setExpectedLedeState(data.expectedLede);
        }
      } catch (e) {
        console.error("Polling failed", e);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [presensieId, fetchDataAction]);

  // Derive ledeMap from the current expectedLede state
  const ledeMap = useMemo(() => {
    return Object.values(expectedLedeState).reduce((acc, lid) => {
      acc[lid.id] = lid.naam || "Onbekend";
      return acc;
    }, {} as Record<string, string>);
  }, [expectedLedeState]);

  // Map initial server data for the hook
  const initialHookData = useMemo(() => serverInklokke.map(inklok => ({
    lidId: inklok.lid.id,
    lidName: inklok.lid.naam || 'Onbekend',
  })), [serverInklokke]);

  const syncHook = useScanSync(presensieId, scanAction, initialHookData);
  const { presensieScans } = syncHook;

  // Create a map of checked-in members from the live data from our hook
  const inklokkeByLidId = useMemo(() => {
    const map = new Map<string, { naam: string; synced: number }>();
    for (const scan of presensieScans) {
      map.set(scan.lidId, { naam: scan.lidName || 'Onbekend', synced: scan.synced });
    }
    return map;
  }, [presensieScans]);

  // Calculate missing members based on the live data
  const missingExpected = useMemo(() => {
    return Object.values(expectedLedeState).filter(lid => !inklokkeByLidId.has(lid.id));
  }, [expectedLedeState, inklokkeByLidId]);

  return (
    <div className="min-h-screen bg-background py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center mb-2">Inklok Skandeerder</h1>
      <h2 className="text-xl text-center text-muted-foreground mb-4">{presensieNaam}</h2>

      <QRScannerModalProvider
        fps={15}
        startopened={true}
        showTorchButtonIfSupported
        showZoomSliderIfSupported
        defaultZoomValueIfSupported={1}
      >
        <ScanListener ledeMap={ledeMap} syncHook={syncHook} />
      </QRScannerModalProvider>

      <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Uitstaande Lede ({missingExpected.length})</h3>
        {missingExpected.length > 0 ? (
          <ul className="list-disc list-inside">
            {missingExpected.map(lid => (
              <li key={lid.id}>{lid.naam ?? lid.id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Almal is ingeklok!</p>
        )}
      </div>

      <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Inklokke ({inklokkeByLidId.size})</h3>
        {inklokkeByLidId.size > 0 ? (
          <ul className="list-none space-y-2">
            {Array.from(inklokkeByLidId.entries()).map(([lidId, data]) => (
              <li key={lidId}>
                <div className="border-2 border-green-600 rounded px-3 py-1 text-green-600 flex items-center justify-between">
                  <span>{lidId} – {data.naam}</span>
                  {data.synced === 0 && (<IconCloudUpload size={18} className="text-orange-500" title="Hangend" />)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Geen inklokke geregistreer.</p>
        )}
      </div>
    </div>
  );
}
