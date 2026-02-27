'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Lede } from '@/payload-types';
import { QRScannerModalProvider } from '@/components/QRScanner';
import ScanListener from './ScanListener';
import { useScanSync } from '@/hooks/useScanSync';
import { IconCloudUpload, IconLogin, IconLogout, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface ScanContainerProps {
  presensieId: string;
  presensieNaam: string;
  initialInklokke: { id: string; lid: { id: string; naam?: string | null }; tipe: 'in' | 'uit'; scan_time: number }[];
  expectedLede: Record<string, Lede>;
  scanAction: (lidid: string, tipe: 'in' | 'uit', time: number) => Promise<{ success: boolean; msg: string }>;
  fetchDataAction: (id: string) => Promise<{
      presensieNaam: string | null | undefined;
      expectedLede: Record<string, Lede>;
      initialInklokke: { id: string; lid: { id: string; naam?: string | null }; tipe: 'in' | 'uit'; scan_time: number }[];
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
  const [scanTipe, setScanTipe] = useState<'in' | 'uit'>('in');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [pendingManualScan, setPendingManualScan] = useState<{lidId: string, naam: string, tipe: 'in' | 'uit'} | null>(null);
  const [tempDontAsk, setTempDontAsk] = useState(false);

  const refreshData = useCallback(async () => {
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
  }, [presensieId, fetchDataAction]);

  // Poll for updates every 15 seconds
  useEffect(() => {
    const timer = setInterval(refreshData, 15000);
    return () => clearInterval(timer);
  }, [refreshData]);

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
    tipe: inklok.tipe,
    scan_time: inklok.scan_time
  })), [serverInklokke]);

  const syncHook = useScanSync(presensieId, scanAction, initialHookData, refreshData);
  const { presensieScans } = syncHook;

  // Create a map of checked-in members from the live data from our hook
  const inklokkeByLidId = useMemo(() => {
    const map = new Map<string, { naam: string; synced: number; tipe: 'in' | 'uit' }>();
    for (const scan of presensieScans) {
      map.set(scan.lidId, { naam: scan.lidName || 'Onbekend', synced: scan.synced, tipe: scan.tipe });
    }
    return map;
  }, [presensieScans]);

  // Calculate missing members based on the live data
  const missingExpected = useMemo(() => {
    return Object.values(expectedLedeState).filter(lid => !inklokkeByLidId.has(lid.id));
  }, [expectedLedeState, inklokkeByLidId]);

  const uitScans = useMemo(() => {
    return Array.from(inklokkeByLidId.entries()).filter(([_, data]) => data.tipe === 'uit');
  }, [inklokkeByLidId]);

  const presentScans = useMemo(() => {
    return Array.from(inklokkeByLidId.entries()).filter(([_, data]) => data.tipe === 'in');
  }, [inklokkeByLidId]);

  const handleManualClick = (lidId: string, naam: string, tipe: 'in' | 'uit') => {
    if (dontAskAgain) {
      syncHook.addScan(lidId, naam, tipe);
    } else {
      setPendingManualScan({ lidId, naam, tipe });
      setTempDontAsk(false);
      setShowConfirmDialog(true);
    }
  };

  const confirmManual = () => {
    if (pendingManualScan) {
      syncHook.addScan(pendingManualScan.lidId, pendingManualScan.naam, pendingManualScan.tipe);
      if (tempDontAsk) setDontAskAgain(true);
      setShowConfirmDialog(false);
      setPendingManualScan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center mb-2">Inklok Skandeerder</h1>
      <h2 className="text-xl text-center text-muted-foreground mb-4">{presensieNaam}</h2>

      <div className="flex gap-4 mb-6">
        <Button 
          variant={scanTipe === 'in' ? 'default' : 'outline'} 
          onClick={() => setScanTipe('in')}
          className="w-32 gap-2"
        >
          <IconLogin size={20} /> In
        </Button>
        <Button 
          variant={scanTipe === 'uit' ? 'destructive' : 'outline'} 
          onClick={() => setScanTipe('uit')}
          className="w-32 gap-2"
        >
          <IconLogout size={20} /> Uit
        </Button>
      </div>

      <QRScannerModalProvider
        fps={15}
        startopened={true}
        showTorchButtonIfSupported
        showZoomSliderIfSupported
        defaultZoomValueIfSupported={1}
      >
        <ScanListener ledeMap={ledeMap} syncHook={syncHook} scanTipe={scanTipe} />
      </QRScannerModalProvider>

      <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Lede Status</h3>
        {(missingExpected.length > 0 || uitScans.length > 0 || presentScans.length > 0) ? (
          <ul className="list-none space-y-2">
            {/* Uitstaande Lede */}
            {missingExpected.map(lid => {
              const scanData = inklokkeByLidId.get(lid.id);
              return (
                <li key={lid.id}>
                  <div className="border-2 border-red-500 text-red-500 rounded px-3 py-1 flex items-center justify-between bg-background">
                    <div className="flex items-center gap-2">
                      <span>{lid.id} – {lid.naam ?? lid.id}</span>
                      {scanData?.synced === 0 && <IconCloudUpload size={18} className="text-orange-500" title="Hangend" />}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-green-100 hover:text-green-700"
                      onClick={() => handleManualClick(lid.id, lid.naam || 'Onbekend', 'in')}
                    >
                      <IconLogin size={18} />
                    </Button>
                  </div>
                </li>
              );
            })}

            {/* Uitgeklok Lede */}
            {uitScans.map(([lidId, data]) => (
              <li key={lidId}>
                <div className="border-2 border-orange-500 text-orange-500 rounded px-3 py-1 flex items-center justify-between bg-background">
                  <div className="flex items-center gap-2">
                    <span>{lidId} – {data.naam} (Uit)</span>
                    {data.synced === 0 && (<IconCloudUpload size={18} className="text-orange-500" title="Hangend" />)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-green-100 hover:text-green-700"
                    onClick={() => handleManualClick(lidId, data.naam, 'in')}
                  >
                    <IconLogin size={18} />
                  </Button>
                </div>
              </li>
            ))}

            {/* Inklokke (Present) */}
            {presentScans.map(([lidId, data]) => (
              <li key={lidId}>
                <div className="border-2 border-green-600 text-green-600 rounded px-3 py-1 flex items-center justify-between bg-background">
                  <div className="flex items-center gap-2">
                    <span>{lidId} – {data.naam}</span>
                    {data.synced === 0 && (<IconCloudUpload size={18} className="text-orange-500" title="Hangend" />)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-700"
                    onClick={() => handleManualClick(lidId, data.naam, 'uit')}
                  >
                    <IconLogout size={18} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Geen lede.</p>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bevestig {pendingManualScan?.tipe === 'in' ? 'Inklok' : 'Uitklok'}</DialogTitle>
            <DialogDescription>
              Wil jy vir <strong>{pendingManualScan?.naam}</strong> met die hand {pendingManualScan?.tipe === 'in' ? 'inklok' : 'uitklok'}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox 
              id="dontAsk" 
              checked={tempDontAsk} 
              onCheckedChange={(c) => setTempDontAsk(c === true)} 
            />
            <label
              htmlFor="dontAsk"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Moenie my weer vra nie
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Kanselleer</Button>
            <Button onClick={confirmManual}>Bevestig</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
